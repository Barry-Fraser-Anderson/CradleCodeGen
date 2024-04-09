// CRADLE security code generator.
'use strict';

// Selectors
const versionSel = document.querySelector('#version');
const modeSel = document.querySelector('#mode-select');
const licencesBox = document.querySelector('.lics-and-tokens');
const connectionsBox = document.querySelector('.connections');
const dateSels = document.querySelectorAll('.date');
const messLab = document.querySelector('#message');
const secLab = document.querySelector('#sec_str');
const durationAmount = document.querySelector('#duration-amount');
const durationUnitSel = document.querySelector('#duration-unit');

let useLicences = true;
let useConnections = true;

////////////////////////////////////////////////////////////////////////////////
// functions

// Display error text
const showError = function (message) {
  messLab.textContent += message + '. ';
};

// Clear error text
const clearError = function () {
  messLab.textContent = '';
};

// Date manipulation
const addYears = function (date, years) {
  const dat = new Date(date.getTime());
  dat.setFullYear(+dat.getFullYear() + +years);
  return dat;
};

const addMonths = function (date, months) {
  const dat = new Date(date.getTime());
  dat.setMonth(+dat.getMonth() + +months);
  return dat;
};

const addDays = function (date, days) {
  const dat = new Date(date.getTime());
  dat.setDate(+dat.getDate() + +days);
  return dat;
};

////////////////////////////////////////////////////////////////////////////////
// Event Handlers

// Hide/show available licences, dependent on version
versionSel.addEventListener('change', function (e) {
  const verNo = +versionSel.value;
  document.querySelectorAll('.input-lic').forEach(function (c) {
    const licName = c.dataset.licence;
    const parent = c.parentNode;
    parent.classList.remove('hidden');
    if (verNo < 7.1) {
      if (licName === 'FAD' || licName === 'SYSML')
        parent.classList.add('hidden');
    }
    if (verNo < 7.5) {
      if (licName === 'ODBC') parent.classList.add('hidden');
    }
    if (verNo < 7.6) {
      if (licName === 'RISK' || licName === 'TEST')
        parent.classList.add('hidden');
    }
  });
});

// Mode selection
modeSel.addEventListener('change', function (e) {
  if (modeSel.value === 'custom') {
    useLicences = true;
    useConnections = true;
    licencesBox.classList.remove('hidden');
    connectionsBox.classList.remove('hidden');
  } else if (modeSel.value === 'EVALUATION') {
    useLicences = false;
    useConnections = true;
    licencesBox.classList.add('hidden');
    connectionsBox.classList.remove('hidden');
  } else {  // module
    useLicences = false;
    useConnections = false;
    licencesBox.classList.add('hidden');
    connectionsBox.classList.add('hidden');
  }
});

// Apply duration to End Date
const durations = [ durationAmount, durationUnitSel];
durations.forEach(el => {
  el.addEventListener('change', function(e) {
    const startDate = new Date(dateSels[0].value);
    let endDate;
    const incr = durationAmount.value;
    switch(durationUnitSel.value) {
    case 'years':
      endDate = addYears(startDate, incr);
      break;
    case 'months':
      endDate = addMonths(startDate, incr);
      break;
    case 'days':
      endDate = addDays(startDate, incr);
      break;
    }
    dateSels[1].value = endDate.toISOString().split('T')[0];
  });
});

// Apply
document.querySelector('#apply').addEventListener('click', function (e) {
  e.preventDefault();

  const secParts = [];
  secParts.push('CRY');
  secParts.push(versionSel.value);

  clearError();
  secLab.textContent = '';

  const seqNo = document.querySelector('#seqNo').value;
  if (Number(seqNo) < 1 || Number(seqNo) > 9999) {
    showError('Sequence number must be between 1 and 9999');
  }
  secParts.push(seqNo.padStart(4, '0'));

  secParts.push(document.querySelector('#arch').value);

  const hostID = document.querySelector('#hostID').value.toLowerCase();
  if (!/^[abcdef0-9]{8}$/.test(hostID)) {
    showError('Host ID must be 8 hex characters');
  }
  secParts.push(hostID);

  // Licences and tokens
  if (useLicences) {
    const lics = [];

    // Licences, comma-separated. Ignore hidden licences.
    document.querySelectorAll('.input-lic').forEach(function (c) {
      if (c.parentNode.classList.contains('hidden')) return;

      const licName = c.dataset.licence;
      if (c.type === 'checkbox') {
        if (c.checked) {
          lics.push(licName);
        }
      }
      if (c.type === 'text') {
        if (c.value === 'T' || Number(c.value) > 0) {
          lics.push(`${licName}=${c.value}`);
        }
      }
      if (c.type === 'select-one') {
        if (c.value !== '0') {
          lics.push(`${licName}=${c.value}`);
        }
      }
    });

    if (lics.length < 1) {
      showError('No licences specified');
    }
    secParts.push(lics.join(','));

    secParts.push(`tokens=${document.querySelector('#tokens').value}`);
  } else {
    secParts.push(modeSel.value);
  }

  if (useConnections) {
    // Connections, comma separated
    const conns = [];
    let connsCount = 0;
    document.querySelectorAll('.input-conn').forEach(function (c) {
      conns.push(`${c.dataset.conn}=${c.value}`);
      connsCount += Number(c.value);
    });
    if (connsCount < 1) {
      showError('No connections specified');
    }
    secParts.push(conns.join(','));
  }

  // Dates, extracted as dd/mm/yyyy
  dateSels.forEach(function (date) {
    const [y, m, d] = date.value.split('-');
    secParts.push(`${d}/${m}/${y}`);
  });

  if (messLab.textContent !== '') return;

  // No errors. So construct sec string from parts, and display it.
 // clearError();
  secLab.textContent = secParts.join(' ');
});

////////////////////////////////////////////////////////////////////////////////

// Handle page refresh
document.querySelector('.form').reset();

// Initialise dates
const now = new Date();
dateSels[0].value = `${now.toISOString().split('T')[0]}`;
dateSels[1].value = `${addDays(now, 14).toISOString().split('T')[0]}`;
