import test from 'node:test';
import assert from 'node:assert/strict';
import { issue } from '../src/booking.js';

const existing = [{id:'own',roomNumber:'A1-203',startDate:'2026-11-09',endDate:'2026-11-11'}];
const form = (startDate='2026-11-12',endDate='2026-11-14',roomNumber='A1-203') => ({roomNumber,startDate,endDate,purpose:''});

test('creates a valid reservation, with optional purpose empty',()=>assert.equal(issue(form(),existing),''));
test('requires room and both dates',()=>{
 for(const field of ['roomNumber','startDate','endDate']) assert.equal(issue({...form(),[field]:''},existing),'Complete the room and both dates.');
});
test('rejects equal and reversed dates',()=>{
 for(const end of ['2026-11-12','2026-11-10']) assert.equal(issue(form('2026-11-12',end),existing),'End date must follow start date.');
});
test('rejects overlaps, including enclosing and enclosed ranges',()=>{
 for(const [start,end] of [['2026-11-08','2026-11-10'],['2026-11-10','2026-11-12'],['2026-11-08','2026-11-12'],['2026-11-09','2026-11-10']]) assert.match(issue(form(start,end),existing),/already booked/);
});
test('allows adjacent reservations because end dates are exclusive',()=>{
 assert.equal(issue(form('2026-11-11','2026-11-12'),existing),'');
 assert.equal(issue(form('2026-11-08','2026-11-09'),existing),'');
});
test('room comparison ignores case and surrounding input whitespace',()=>assert.match(issue(form('2026-11-09','2026-11-10',' a1-203 '),existing),/already booked/));
test('allows a different room for the same dates',()=>assert.equal(issue(form('2026-11-09','2026-11-10','B1-205'),existing),''));
test('editing excludes the original booking but still checks other reservations',()=>{
 assert.equal(issue(form('2026-11-09','2026-11-11'),existing,'own'),'');
 assert.match(issue(form('2026-11-09','2026-11-11'),[...existing,{...existing[0],id:'other'}],'own'),/already booked/);
});
