import test from 'node:test';
import assert from 'node:assert/strict';
import {addDays,findFreeRooms,mondayOf,normalizeRoom,stayLabel,validateBooking,validateDates} from './booking.js';
import {rooms,seed} from './data.js';

const form=(roomNumber,startDate,endDate)=>({roomNumber,startDate,endDate,purpose:''});
const fields=errors=>Object.keys(errors).sort();

test('the demo has 18 rooms and 40 non-overlapping bookings',()=>{
  assert.equal(rooms.length,18);
  assert.equal(seed.length,40);
  for(const b of seed)assert.deepEqual(validateBooking(b,seed,b.id),{});
});

test('a free range is valid and purpose is optional',()=>{
  assert.deepEqual(validateBooking(form('A3-209','2026-11-13','2026-11-15'),seed),{});
});

test('a missing room or date is reported on its own field',()=>{
  assert.deepEqual(fields(validateBooking(form('  ','2026-11-20','2026-11-21'),seed)),['roomNumber']);
  assert.deepEqual(fields(validateBooking(form('A1-203','','2026-11-21'),seed)),['startDate']);
  assert.deepEqual(fields(validateBooking(form('A1-203','2026-11-20',''),seed)),['endDate']);
});

test('the end date must be strictly after the start date',()=>{
  assert.ok(validateDates('2026-11-20','2026-11-20').endDate);
  assert.ok(validateDates('2026-11-22','2026-11-20').endDate);
  assert.deepEqual(validateDates('2026-11-20','2026-11-21'),{});
});

test('overlaps in the same room are rejected and name the clashing dates',()=>{
  const errors=validateBooking(form('A1-203','2026-11-10','2026-11-12'),seed);
  assert.match(errors.dates,/A1-203 from 9 Nov until 11 Nov/);
  assert.ok(validateBooking(form('a1-203','2026-11-10','2026-11-12'),seed).dates,'room match ignores case');
});

test('end dates are exclusive, so back-to-back bookings are allowed',()=>{
  assert.deepEqual(validateBooking(form('A1-203','2026-11-11','2026-11-13'),seed),{});
});

test('the same dates in a different room are accepted',()=>{
  assert.deepEqual(validateBooking(form('A3-208','2026-11-09','2026-11-11'),seed),{});
});

test('editing ignores the booking being edited but not any other booking',()=>{
  const own=seed.find(b=>b.roomNumber==='A1-203'&&b.owner==='you');
  assert.deepEqual(validateBooking(form('A1-203','2026-11-17','2026-11-20'),seed,own.id),{});
  assert.ok(validateBooking(form('A1-203','2026-11-14','2026-11-18'),seed,own.id).dates);
});

test('free-room search only returns rooms free for the whole range',()=>{
  assert.deepEqual(findFreeRooms(seed,'2026-11-13','2026-11-16'),['A2-106','A3-209','B1-206','B1-207','B3-301','C2-202','D1-101']);
  const own=seed.find(b=>b.roomNumber==='C1-103'&&b.owner==='you');
  assert.ok(!findFreeRooms(seed,'2026-11-14','2026-11-16').includes('C1-103'));
  assert.ok(findFreeRooms(seed,'2026-11-14','2026-11-16',own.id).includes('C1-103'));
});

test('room input maps to the directory spelling and keeps unknown text',()=>{
  assert.equal(normalizeRoom(' a3-209 '),'A3-209');
  assert.equal(normalizeRoom(' Z9-999 '),'Z9-999');
});

test('date helpers',()=>{
  assert.equal(addDays('2026-11-30',1),'2026-12-01');
  assert.equal(mondayOf('2026-11-15'),'2026-11-09');
  assert.equal(mondayOf('2026-11-16'),'2026-11-16');
  assert.equal(stayLabel('2026-11-09','2026-11-10'),'1 day reserved · free again from 10 Nov');
  assert.equal(stayLabel('2026-11-09','2026-11-11'),'2 days reserved · free again from 11 Nov');
});
