/**
 * Excel-style table filtering utility
 * Adds filter icons to headers, searchable checkbox lists, and row hiding.
 */

export function attachExcelFilters(table) {
    if (!table || table.dataset.filtered === 'true') return;
    table.dataset.filtered = 'true';
    const headers = table.querySelectorAll('thead th');
    const rows = Array.from(table.querySelectorAll('tbody tr:not(.no-filter)'));
    
    // Create Popover Element if not exists
    let popover = document.getElementById('excel-filter-popover');
    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'excel-filter-popover';
        popover.className = 'filter-popover';
        document.body.appendChild(popover);
    }

    const activeFilters = {}; // { colIndex: Set([values]) }

    const applyFilters = () => {
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let isVisible = true;
            Object.entries(activeFilters).forEach(([colIdx, selectedValues]) => {
                const cellText = cells[colIdx]?.innerText.trim() || '';
                if (!selectedValues.has(cellText)) isVisible = false;
            });
            row.style.display = isVisible ? '' : 'none';
        });
    };

    const sortRows = (colIdx, desc = false) => {
        const tbody = table.querySelector('tbody');
        const sorted = rows.sort((a, b) => {
            let vA = a.querySelectorAll('td')[colIdx]?.innerText.trim() || '';
            let vB = b.querySelectorAll('td')[colIdx]?.innerText.trim() || '';
            
            // Numeric check
            const nA = parseFloat(vA.replace(/[₹,]/g, ''));
            const nB = parseFloat(vB.replace(/[₹,]/g, ''));
            if (!isNaN(nA) && !isNaN(nB)) {
                return desc ? nB - nA : nA - nB;
            }
            return desc ? vB.localeCompare(vA) : vA.localeCompare(vB);
        });
        sorted.forEach(row => tbody.appendChild(row));
    };

    headers.forEach((th, idx) => {
        // Skip columns without text or actions
        if (!th.innerText.trim() || th.classList.contains('text-right')) {
            // But sometimes people want to filter amounts? Sure, why not.
        }

        const thInner = document.createElement('div');
        thInner.className = 'th-inner';
        const text = th.innerText;
        th.innerHTML = '';
        thInner.innerHTML = `<span>${text}</span> <i class="ph ph-funnel th-filter-btn" data-col="${idx}"></i>`;
        th.appendChild(thInner);

        const btn = thInner.querySelector('.th-filter-btn');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = btn.getBoundingClientRect();
            
            // Extract unique values from this column
            const values = Array.from(new Set(rows.map(r => r.querySelectorAll('td')[idx]?.innerText.trim() || '(Empty)'))).sort();
            
            renderPopover(btn, idx, values, rect);
        });
    });

    const renderPopover = (btn, colIdx, values, rect) => {
        popover.style.top = `${rect.bottom + 5}px`;
        popover.style.left = `${Math.min(rect.left, window.innerWidth - 250)}px`;
        popover.classList.add('active');

        const currentSelected = activeFilters[colIdx] || new Set(values);

        popover.innerHTML = `
            <div class="filter-sort-btns mb-4 flex gap-2">
                <button class="btn btn-sm btn-secondary flex-1" id="pop-sort-asc"><i class="ph ph-sort-ascending"></i> Sort A-Z</button>
                <button class="btn btn-sm btn-secondary flex-1" id="pop-sort-desc"><i class="ph ph-sort-descending"></i> Sort Z-A</button>
            </div>
            <div class="filter-search">
                <input type="text" class="form-control form-control-sm" id="pop-search" placeholder="Search values...">
            </div>
            <div class="filter-list" id="pop-list">
                <label class="filter-option"><input type="checkbox" id="pop-all" ${currentSelected.size === values.length ? 'checked' : ''}> <span>(Select All)</span></label>
                ${values.map(v => `
                    <label class="filter-option">
                        <input type="checkbox" class="pop-item" value="${v}" ${currentSelected.has(v) ? 'checked' : ''}>
                        <span>${v}</span>
                    </label>
                `).join('')}
            </div>
            <div class="filter-footer">
                <button class="btn btn-sm btn-secondary" id="pop-clear">Clear</button>
                <button class="btn btn-sm btn-primary" id="pop-apply">Apply</button>
            </div>
        `;

        // Sort events
        popover.querySelector('#pop-sort-asc').addEventListener('click', () => { sortRows(colIdx, false); popover.classList.remove('active'); });
        popover.querySelector('#pop-sort-desc').addEventListener('click', () => { sortRows(colIdx, true); popover.classList.remove('active'); });

        // Search logic
        const sInput = popover.querySelector('#pop-search');
        sInput.focus();
        sInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            popover.querySelectorAll('.filter-option').forEach(opt => {
                if (opt.innerText.toLowerCase().includes(term) || opt.id === 'pop-all') {
                    opt.style.display = 'flex';
                } else {
                    opt.style.display = 'none';
                }
            });
        });

        // Select All
        const allChk = popover.querySelector('#pop-all');
        allChk.addEventListener('change', () => {
            popover.querySelectorAll('.pop-item').forEach(chk => chk.checked = allChk.checked);
        });

        popover.querySelector('#pop-clear').addEventListener('click', () => {
            delete activeFilters[colIdx];
            btn.classList.remove('active');
            popover.classList.remove('active');
            applyFilters();
        });

        popover.querySelector('#pop-apply').addEventListener('click', () => {
            const selected = new Set();
            popover.querySelectorAll('.pop-item:checked').forEach(chk => selected.add(chk.value));
            
            if (selected.size === values.length) {
                delete activeFilters[colIdx];
                btn.classList.remove('active');
            } else {
                activeFilters[colIdx] = selected;
                btn.classList.add('active');
            }
            
            popover.classList.remove('active');
            applyFilters();
        });
    };

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (!popover.contains(e.target)) popover.classList.remove('active');
    }, { capture: true });
}
