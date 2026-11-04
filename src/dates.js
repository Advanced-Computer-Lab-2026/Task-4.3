export function isDate(value) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
 const date = new Date(`${value}T12:00:00Z`);
 return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10) === value;
}
export function addDays(iso, days) {
 const date = new Date(`${iso}T12:00:00Z`);
 date.setUTCDate(date.getUTCDate() + days);
 return date.toISOString().slice(0,10);
}
export function startOfWeek(iso) {
 const weekday = new Date(`${iso}T12:00:00Z`).getUTCDay();
 return addDays(iso, -((weekday + 6) % 7));
}
export function localToday() {
 const now = new Date();
 return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function human(iso) {
 return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB',{timeZone:'UTC',day:'numeric',month:'short',year:'numeric'});
}
export function changeStart(form, startDate) {
 return {...form,startDate,endDate: startDate && (!form.endDate || form.endDate<=startDate) ? addDays(startDate,1) : form.endDate};
}
