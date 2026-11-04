import test from 'node:test';
import assert from 'node:assert/strict';
import {addDays,startOfWeek,isDate,changeStart,human} from '../src/dates.js';
import {issue} from '../src/booking.js';

test('weeks run Monday to Sunday across month and year boundaries',()=>{
 assert.equal(startOfWeek('2026-11-04'),'2026-11-02');
 assert.equal(startOfWeek('2026-11-08'),'2026-11-02');
 assert.equal(startOfWeek('2027-01-01'),'2026-12-28');
 assert.equal(addDays('2026-12-28',6),'2027-01-03');
});
test('date arithmetic handles leap days and year rollover',()=>{
 assert.equal(addDays('2028-02-28',1),'2028-02-29');
 assert.equal(addDays('2026-12-31',1),'2027-01-01');
});
test('invalid dates are rejected before reservation comparison',()=>{
 for(const date of ['2026-02-29','2026-02-30','2026-13-01','bad']) {
  assert.equal(isDate(date),false);
  assert.equal(issue({roomNumber:'A1-203',startDate:date,endDate:'2027-01-01'},[]),'Enter valid start and end dates.');
 }
 assert.equal(isDate('2028-02-29'),true);
});
test('changing start advances an invalid end while preserving a valid chosen end',()=>{
 assert.equal(changeStart({endDate:'2026-11-05'},'2026-11-06').endDate,'2026-11-07');
 assert.equal(changeStart({endDate:''},'2026-12-31').endDate,'2027-01-01');
 assert.equal(changeStart({endDate:'2026-11-10'},'2026-11-06').endDate,'2026-11-10');
 assert.equal(changeStart({endDate:'2026-11-10'},'').startDate,'');
});
test('visible date labels include the year',()=>assert.match(human('2027-01-01'),/2027/));
