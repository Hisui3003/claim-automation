document.addEventListener('DOMContentLoaded', () => {
  const rowsContainer = document.getElementById('rowsContainer');
  const previewRows = document.getElementById('previewRows');
  const previewWrap = document.getElementById('previewWrap');
  const claimForm = document.getElementById('claimForm');

  let entries = [];

  function formatPeso(value) {
    const number = Number(value) || 0;

    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(number);
  }

  function formatDate(value) {
    if (!value) return '';

    const date = new Date(value + 'T00:00:00');

    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = String(date.getFullYear()).slice(-2);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const wd = weekdays[date.getDay()];

    return `${day}-${month}-${year} ${wd}`;
  }

  function calculateHours(timeIn, timeOut) {
    if (!timeIn || !timeOut) return 0;

    const start = new Date(`2000-01-01T${timeIn}`);
    const end = new Date(`2000-01-01T${timeOut}`);

    if (end <= start) return 0;

    const diff = (end - start) / 1000 / 60 / 60;

    return diff;
  }

  function fitPreviewToViewport() {
    if (!previewWrap.classList.contains('is-expanded')) return;

    claimForm.style.transform = 'none';
    claimForm.style.zoom = '1';
    claimForm.style.marginTop = '12px';
    claimForm.style.marginBottom = '12px';

    const toolbar = previewWrap.querySelector('.preview-toolbar');
    const availableWidth = Math.max(previewWrap.clientWidth - 88, 260);
    const availableHeight = Math.max(previewWrap.clientHeight - (toolbar ? toolbar.offsetHeight : 0) - 88, 260);
    const contentWidth = claimForm.offsetWidth;
    const contentHeight = claimForm.offsetHeight;
    const scale = Math.min(availableWidth / contentWidth, availableHeight / contentHeight, 1);

    claimForm.style.zoom = String(scale);
  }

  function addRow(data = {}) {
    entries.push({
      date: data.date || '',
      timeIn: data.timeIn || '',
      timeOut: data.timeOut || '',
      hours: data.hours || 0
    });

    renderInputs();
    updatePreview();
  }

  function removeRow(index) {
    entries.splice(index, 1);
    renderInputs();
    updatePreview();
  }

  function updateEntry(index, field, value) {
    entries[index][field] = value;
    entries[index].hours = calculateHours(entries[index].timeIn, entries[index].timeOut);

    renderInputs();
    updatePreview();
  }

  function renderInputs() {
    rowsContainer.innerHTML = '';

    entries.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = 'row-card';

      row.innerHTML = `
        <div class="row-card-top">
          <span>Entry ${index + 1}</span>
          ${entries.length > 1 ? `<button class="remove-btn" type="button" onclick="removeRow(${index})">Remove</button>` : ''}
        </div>

        <div class="field">
          <label>Date</label>
          <input
            type="date"
            value="${entry.date}"
            onchange="updateEntry(${index}, 'date', this.value)"
          />
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Time In</label>
            <input
              type="time"
              value="${entry.timeIn}"
              onchange="updateEntry(${index}, 'timeIn', this.value)"
            />
          </div>

          <div class="field">
            <label>Time Out</label>
            <input
              type="time"
              value="${entry.timeOut}"
              onchange="updateEntry(${index}, 'timeOut', this.value)"
            />
          </div>
        </div>

        <div class="field">
          <label>No. of Hours</label>
          <input type="text" value="${entry.hours.toFixed(2)}" readonly />
        </div>
      `;

      rowsContainer.appendChild(row);
    });
  }

  function updatePreview() {
    document.getElementById('previewTrainee').textContent = document.getElementById('trainee').value;
    document.getElementById('previewDepartment').textContent = document.getElementById('department').value;
    document.getElementById('previewFrom').textContent = formatDate(document.getElementById('periodFrom').value);
    document.getElementById('previewTo').textContent = formatDate(document.getElementById('periodTo').value);

    const dailyRate = Number(document.getElementById('dailyRate').value) || 0;
    const validDays = entries.filter(entry => Number(entry.hours) > 0).length;
    const totalClaim = validDays * dailyRate;
    const totalHours = entries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0);

    document.getElementById('previewDays').textContent = validDays;
    document.getElementById('previewRate').textContent = formatPeso(dailyRate);
    document.getElementById('previewDailyClaim').textContent = formatPeso(totalClaim);
    document.getElementById('previewTotal').textContent = formatPeso(totalClaim);
    document.getElementById('previewTotalHours').textContent = totalHours.toFixed(2);

    document.getElementById('previewPreparedBy').textContent = document.getElementById('preparedBy').value;
    document.getElementById('previewCheckedBy').textContent = document.getElementById('checkedBy').value;
    document.getElementById('previewApprovedBy').textContent = document.getElementById('approvedBy').value;

    previewRows.innerHTML = '';

    const rowsToShow = Math.max(entries.length, 10);

    for (let index = 0; index < rowsToShow; index++) {
      const entry = entries[index] || {
        date: '',
        timeIn: '',
        timeOut: '',
        hours: 0
      };

      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${formatDate(entry.date)}</td>
        <td>${entry.timeIn || ''}</td>
        <td>${entry.timeOut || ''}</td>
        <td class="hours-cell">${Number(entry.hours || 0).toFixed(2)}</td>
      `;

      previewRows.appendChild(row);
    }

    fitPreviewToViewport();
  }

  function downloadPDF() {
    updatePreview();
    const element = document.getElementById('claimForm');
    const trainee = document.getElementById('trainee').value || 'trainee';
    const safeName = trainee.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Clone the form into an off-screen container to capture a clean, unzoomed layout
    const clone = element.cloneNode(true);
    clone.classList.add('pdf-ready');
    clone.style.transform = 'none';
    clone.style.zoom = '1';
    clone.style.margin = '0';

    // Compute A4 size in pixels at 96dpi so clone width exactly matches jsPDF A4 width
    const DPI = 96;
    const PT_PER_INCH = 72;
    const pxPerPt = DPI / PT_PER_INCH; // 1.3333 at 96dpi
    const A4_WIDTH_PT = 595.28; // A4 width in points
    const A4_HEIGHT_PT = 841.89; // A4 height in points
    const a4WidthPx = Math.round(A4_WIDTH_PT * pxPerPt);
    const a4HeightPx = Math.round(A4_HEIGHT_PT * pxPerPt);

    clone.style.width = `${a4WidthPx}px`;

    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.width = `${a4WidthPx}px`;
    wrapper.style.height = 'auto';
    wrapper.style.overflow = 'hidden';
    wrapper.style.background = '#fff';
    wrapper.style.zIndex = '9999';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    const options = {
      margin: 10,
      filename: `${safeName}_allowance_claim_form.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, width: a4WidthPx },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    };

    // Wait briefly for images/fonts to settle, then capture the clone only
    // compute available pixel height for A4 minus margins
    const marginPt = options.margin || 0;
    const availableHeightPx = Math.floor((A4_HEIGHT_PT - 2 * marginPt) * pxPerPt);
    // cap clone height so html2pdf doesn't span pages
    clone.style.maxHeight = `${availableHeightPx}px`;
    clone.style.overflow = 'hidden';

    setTimeout(() => {
      html2pdf().set(options).from(clone).save().finally(() => {
        // clean up
        if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        // re-run fit in case styles changed
        setTimeout(fitPreviewToViewport, 50);
      });
    }, 300);
  }

  function resetForm() {
    document.querySelectorAll('input').forEach(input => {
      if (input.id === 'dailyRate') {
        input.value = 695;
      } else {
        input.value = '';
      }
    });

    entries = [];
    addRow();
    updatePreview();
  }

  // Attach global handlers used by inline onclick attributes
  window.addRow = addRow;
  window.removeRow = removeRow;
  window.updateEntry = updateEntry;
  window.downloadPDF = downloadPDF;
  window.resetForm = resetForm;

  // preview toggle removed — preview is expanded by default

  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', updatePreview);
    input.addEventListener('change', updatePreview);
  });

  window.addEventListener('resize', fitPreviewToViewport);

  // keep preparedBy in sync with trainee input
  const traineeInput = document.getElementById('trainee');
  const preparedInput = document.getElementById('preparedBy');
  traineeInput.addEventListener('input', () => {
    preparedInput.value = traineeInput.value;
    updatePreview();
  });

  previewWrap.classList.add('is-expanded');
  addRow();
  fitPreviewToViewport();
});
