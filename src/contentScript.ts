'use strict';

import { ExtSettings } from './popup';

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

const ERROR_ELEM_NOT_EXIST = (elem: string) =>
  'Uh oh... ' +
  `Seems like attendee ${elem} does not exists. ` +
  'If the table EXISTS, please create a issue on ' +
  'https://github.com/somidad/knox-meeting-attendees/issues/new/choose';

const ARRAY_DID_ATTEND = ['참석', 'Attended', '出勤', '出席'];

// Listen for message
chrome.runtime.onMessage.addListener(
  (
    { nameToExclude, businessUnitToHide, groupByDivision }: ExtSettings,
    sender,
    sendResponse
  ) => {
    console.log(
      'knox-meeting-attendees: Received request to get attendees from popup'
    );
    const table = document.querySelector('.conts-list table tbody');
    if (!table) {
      console.log('knox-meeting-attendees: Table tag is not found');
      sendResponse(ERROR_ELEM_NOT_EXIST('table'));
      return;
    }
    const rows = table.querySelectorAll('tr');
    if (!rows.length) {
      console.log('knox-meeting-attendees: Table row tag is not found');
      sendResponse(ERROR_ELEM_NOT_EXIST('row'));
      return;
    }
    const attendeesByDivision: { [division: string]: string[] } = {};
    let totalAttendees = 0;
    rows.forEach((row) => {
      const [cellName, , cellDivision, , cellDidAttend] =
        row.querySelectorAll('td');
      const spanName = cellName.querySelector('span');
      const name = spanName ? spanName.textContent : cellName.textContent;
      if (!name || name === nameToExclude) {
        return;
      }
      let division = cellDivision.textContent ?? '';
      if (businessUnitToHide) {
        const index = division.lastIndexOf(`(${businessUnitToHide})`);
        if (index !== -1) {
          division = division.substring(0, index).trim();
        }
      }
      if (!ARRAY_DID_ATTEND.includes(cellDidAttend.textContent ?? '')) {
        return;
      }
      // Currently only Group by division is supported
      totalAttendees++;
      if (!(division in attendeesByDivision)) {
        attendeesByDivision[division] = [name];
      } else {
        attendeesByDivision[division].push(name);
      }
    });
    const attendees = Object.entries(attendeesByDivision)
      .map(
        ([division, attendeesPerDivision]) =>
          `${division}: ${attendeesPerDivision.join(', ')}`
      )
      .join('\n');
    console.log(`knox-meeting-attendees: Total ${totalAttendees} attendees`);
    console.log('knox-meeting-attendees: Sending response to popup');
    sendResponse(attendees);
  }
);
