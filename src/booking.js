import {rooms} from './data.js';

const utc=iso=>new Date(`${iso}T12:00:00Z`);

export function addDays(iso,days){const t=utc(iso);t.setUTCDate(t.getUTCDate()+days);return t.toISOString().slice(0,10);}
export function daysBetween(start,end){return Math.round((utc(end)-utc(start))/86400000);}
export function mondayOf(iso){return addDays(iso,-((utc(iso).getUTCDay()+6)%7));}
export function human(iso){return utc(iso).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short'});}
export function weekDay(iso){return utc(iso).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'short'});}
export function longDate(iso){return utc(iso).toLocaleDateString('en-GB',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long'});}

// End dates are exclusive: the room is free again on the end date itself.
export function stayLabel(start,end){const n=daysBetween(start,end);return `${n} ${n===1?'day':'days'} reserved · free again from ${human(end)}`;}

export function sameRoom(a,b){return a.trim().toLowerCase()===b.trim().toLowerCase();}
export function isKnownRoom(value){return rooms.some(r=>sameRoom(r,value));}
export function normalizeRoom(value){return rooms.find(r=>sameRoom(r,value))||value.trim();}

export function overlaps(booking,room,start,end,ignoreId){
  return booking.id!==ignoreId&&sameRoom(booking.roomNumber,room)&&start<booking.endDate&&end>booking.startDate;
}
export function bookingOn(bookings,room,date){return bookings.find(b=>sameRoom(b.roomNumber,room)&&date>=b.startDate&&date<b.endDate);}
export function findFreeRooms(bookings,start,end,ignoreId){return rooms.filter(room=>!bookings.some(b=>overlaps(b,room,start,end,ignoreId)));}

export function validateDates(start,end){
  const errors={};
  if(!start)errors.startDate='Choose a start date.';
  if(!end)errors.endDate='Choose an end date.';
  if(start&&end&&end<=start)errors.endDate='End date must be after the start date.';
  return errors;
}

// Returns {} when valid, otherwise one message per problem, keyed by the field it belongs to.
export function validateBooking(form,bookings,ignoreId){
  const errors=validateDates(form.startDate,form.endDate);
  if(!form.roomNumber.trim())errors.roomNumber='Choose a room.';
  if(Object.keys(errors).length)return errors;
  const clash=bookings.filter(b=>overlaps(b,form.roomNumber,form.startDate,form.endDate,ignoreId)).sort((a,b)=>a.startDate.localeCompare(b.startDate))[0];
  if(clash){
    const holder=clash.owner==='you'?'You already have':'Another student has';
    errors.dates=`${holder} ${normalizeRoom(form.roomNumber)} from ${human(clash.startDate)} until ${human(clash.endDate)}. Pick other dates or another room.`;
  }
  return errors;
}
