'use strict';

import './bulma.min.css';

export type ExtSettings = {
  nameToExclude?: string;
  businessUnitToHide?: string;
  groupByDivision?: boolean;
};

(function () {
  // We will make use of Storage API to get and store `count` value
  // More information on Storage API can we found at
  // https://developer.chrome.com/extensions/storage

  // To get storage access, we have to mention it in `permissions` property of manifest.json file
  // More information on Permissions can we found at
  // https://developer.chrome.com/extensions/declare_permissions
  const extStorage = {
    get: (
      cb: ({
        nameToExclude,
        businessUnitToHide,
        groupByDivision,
      }: ExtSettings) => void
    ) => {
      chrome.storage.sync.get(
        ['nameToExclude', 'groupByDivision', 'businessUnitToHide'],
        (result) => {
          cb(result as ExtSettings);
        }
      );
    },
    set: (
      { nameToExclude, groupByDivision, businessUnitToHide }: ExtSettings,
      cb: () => void
    ) => {
      chrome.storage.sync.set(
        {
          nameToExclude,
          businessUnitToHide,
          groupByDivision,
        },
        () => {
          cb();
        }
      );
    },
  };

  function setupExt({
    nameToExclude,
    businessUnitToHide,
    groupByDivision,
  }: ExtSettings) {
    const buttonReportBug = document.getElementById(
      'report-bug'
    ) as HTMLButtonElement;
    const inputNameToExclude = document.getElementById(
      'name-to-exclude'
    ) as HTMLInputElement;
    // const checkGroupByDivision = document.getElementById(
    //   'group-by-division'
    // ) as HTMLInputElement;
    const inputBusinessUnitToHide = document.getElementById(
      'business-unit-to-hide'
    ) as HTMLInputElement;
    const buttonGetAttendees = document.getElementById(
      'get-attendees'
    ) as HTMLButtonElement;
    const textareaAttendees = document.getElementById(
      'attendees'
    ) as HTMLTextAreaElement;
    const buttonCopyToClipboard = document.getElementById(
      'copy-to-clipboard'
    ) as HTMLButtonElement;

    buttonReportBug.addEventListener('click', () => {
      chrome.tabs.create({
        url: 'https://github.com/somidad/knox-meeting-attendees/issues/new/choose',
      });
    });

    inputNameToExclude.value = nameToExclude ?? '';
    inputBusinessUnitToHide.value = businessUnitToHide ?? '';
    // checkGroupByDivision.checked = groupByDivision ?? true;

    buttonGetAttendees.addEventListener('click', () => {
      const nameToExclude = inputNameToExclude.value;
      const businessUnitToHide = inputBusinessUnitToHide.value;
      // const groupByDivision = checkGroupByDivision.checked;
      extStorage.set(
        { nameToExclude, groupByDivision, businessUnitToHide },
        () => {
          chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
            if (tabs[0].id === undefined) {
              console.log('Tab ID is undefined');
              return;
            }
            console.log('Requesting content script to get attendees...');
            chrome.tabs.sendMessage(
              tabs[0].id,
              { nameToExclude, businessUnitToHide, groupByDivision },
              (response) => {
                console.group('Received response from content script:');
                console.log(response);
                console.groupEnd();
                if (response === undefined) {
                  textareaAttendees.value =
                    'Something went wrong. Please report bug to improve this extension';
                } else if (response === '') {
                  textareaAttendees.value = 'No attendee';
                } else {
                  textareaAttendees.value = response;
                }
              }
            );
          });
        }
      );
    });

    buttonCopyToClipboard.addEventListener('click', () => {
      navigator.clipboard.writeText(textareaAttendees.value);
    });
  }

  function restoreExt() {
    // Restore count value
    extStorage.get((extSettings: ExtSettings) => {
      const nameToExclude = extSettings.nameToExclude ?? '';
      const businessUnitToHide = extSettings.businessUnitToHide ?? '';
      const groupByDivision = extSettings.groupByDivision ?? true;
      extStorage.set(
        { nameToExclude, groupByDivision, businessUnitToHide },
        () => {
          setupExt({ nameToExclude, groupByDivision, businessUnitToHide });
        }
      );
    });
  }

  document.addEventListener('DOMContentLoaded', restoreExt);

  // Communicate with background file by sending a message
  chrome.runtime.sendMessage(
    {
      type: 'GREETINGS',
      payload: {
        message: 'Hello, my name is Pop. I am from Popup.',
      },
    },
    (response) => {
      console.log(response.message);
    }
  );
})();
