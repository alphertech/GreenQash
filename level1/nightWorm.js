//i'm responsible for generating content
//append user activity function to recent activitie
const genActivities = document.getElementById('genActivities');
const bdy = document.getElementById('bdy');
const rowAct = document.getElementById('rowAct');
const time = document.getElementById('time');
const username = document.getElementById('username');
const activity = document.getElementById('activity');
const details = document.getElementById('details');
const status = document.getElementById('status');

//append function
function createActivityRow() {
    console.log("New row inserted");
    row = document.createElement("row");
    td = document.createElement("td");
    td = document.createElement("td");
    td = document.createElement("td");
    td = document.createElement("td");
    td = document.createElement("td")

    //append children to parent
    row.appendChild("td");
}
