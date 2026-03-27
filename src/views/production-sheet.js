import { db, formatDate, fmt } from '../store/db.js';

export default function ProductionSheetView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in';
    let activeTab = 'entry';
    let inputRows = [{ itemId: '', itemType: 'chemical', qty: '' }];

    const render = () => {
        c.innerHTML = `
          <div class="tabs">
            <div class="tab ${activeTab==='entry'?'active':''}" data-tab="entry">Sheet Making Entry</div>
            <div class="tab ${activeTab==='history'?'active':''}" data-tab="history">Batch History</div>
          </div>
          <div id="tab-content"></div>
        `;
        c.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { activeTab = t.dataset.tab; render(); }));
        const content = c.querySelector('#tab-content');
        if (activeTab === 'entry') renderEntry(content);
        else renderHistory(content);
    };

    const renderEntry = (el) => {
        const chemicals = db.data.chemicals;
        const sheetStock = db.getSheetStock();
        const wasteStock = db.getWasteStock();

        el.innerHTML = `
          <div class="card">
            <div class="section-header">
              <div>
                <div class="section-title">Stage 1: Sheet Making Entry</div>
                <div class="section-subtitle">Mix chemicals to produce rubber sheets</div>
              </div>
            </div>

            <div class="grid-3 mb-4">
              <div class="form-group">
                <label class="form-label">Date</label>
                <input type="date" class="form-control" id="sh-date" value="${formatDate()}">
              </div>
              <div class="form-group">
                <label class="form-label">Production Type</label>
                <select class="form-control" id="sh-type">
                  <option value="silicon">Silicon</option>
                  <option value="non-silicon">Non-Silicon</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Operator Name</label>
                <input class="form-control" id="sh-operator" placeholder="Operator name">
              </div>
            </div>

            <!-- Current Sheet Stock Info -->
            <div class="grid-3 mb-4">
              ${sheetStock.map(s => `
                <div class="alert alert-info mb-0"><i class="ph ph-info"></i> ${s.item.name}: <strong>${s.qty} Kg</strong></div>
              `).join('')}
              <div class="alert alert-warning mb-0"><i class="ph ph-recycle"></i> Waste Stock: <strong>${wasteStock} Kg</strong></div>
            </div>

            <div class="grid-2 mb-4" style="gap:1rem">
              <!-- Input Materials -->
              <div class="panel">
                <div class="panel-title" style="color:var(--accent-danger)"><i class="ph ph-arrow-circle-down"></i> Input Materials (Consumed)</div>
                <div id="sh-inputs"></div>
                <button class="btn btn-sm btn-secondary mt-4" id="btn-add-sh-input"><i class="ph ph-plus"></i> Add Material</button>
              </div>

              <!-- Output -->
              <div class="panel">
                <div class="panel-title" style="color:var(--accent-success)"><i class="ph ph-arrow-circle-up"></i> Output Sheet Produced</div>
                <div class="form-group">
                  <label class="form-label">Sheet Output (Kg)</label>
                  <input type="number" class="form-control" id="sh-output-kg" placeholder="Kg produced">
                </div>
                <div class="form-group">
                  <label class="form-label">Remarks</label>
                  <input class="form-control" id="sh-narration" placeholder="Batch remarks">
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button class="btn btn-primary" id="btn-save-sh"><i class="ph ph-floppy-disk"></i> Save Sheet Making Entry</button>
            </div>
          </div>
        `;

        const renderInputs = () => {
            const container = el.querySelector('#sh-inputs');
            container.innerHTML = inputRows.map((r, idx) => `
              <div class="inline-row">
                <select class="form-control sh-type-sel" data-idx="${idx}" style="width:130px">
                  <option value="chemical" ${r.itemType==='chemical'?'selected':''}>Chemical</option>
                  <option value="waste" ${r.itemType==='waste'?'selected':''}>Cutting Waste</option>
                  <option value="sheet" ${r.itemType==='sheet'?'selected':''}>Leftover Sheet</option>
                </select>
                <select class="form-control sh-item-sel" data-idx="${idx}" style="flex:1">
                  <option value="">-- Select --</option>
                  ${r.itemType === 'chemical' ? chemicals.map(ch => `<option value="${ch.id}" ${r.itemId===ch.id?'selected':''}>${ch.name} (${ch.unit})</option>`).join('') : ''}
                  ${r.itemType === 'waste' ? `<option value="waste_nonsilicon" ${r.itemId==='waste_nonsilicon'?'selected':''}>Non-Silicon Cutting Waste (Kg)</option>` : ''}
                  ${r.itemType === 'sheet' ? db.data.sheetTypes.map(s => `<option value="${s.id}" ${r.itemId===s.id?'selected':''}>${s.name}</option>`).join('') : ''}
                </select>
                <input type="number" class="form-control sh-qty" data-idx="${idx}" placeholder="Kg" value="${r.qty}" style="width:90px">
                <button class="btn btn-ghost sh-del" data-idx="${idx}"><i class="ph ph-trash" style="color:var(--accent-danger)"></i></button>
              </div>
            `).join('');

            container.querySelectorAll('.sh-type-sel').forEach(s => s.addEventListener('change', e => {
                inputRows[+e.target.dataset.idx].itemType = e.target.value;
                inputRows[+e.target.dataset.idx].itemId = '';
                renderInputs();
            }));
            container.querySelectorAll('.sh-item-sel').forEach(s => s.addEventListener('change', e => {
                inputRows[+e.target.dataset.idx].itemId = e.target.value;
            }));
            container.querySelectorAll('.sh-qty').forEach(s => s.addEventListener('input', e => {
                inputRows[+e.target.dataset.idx].qty = +e.target.value;
            }));
            container.querySelectorAll('.sh-del').forEach(s => s.addEventListener('click', e => {
                inputRows.splice(+e.currentTarget.dataset.idx, 1);
                if (inputRows.length === 0) inputRows.push({ itemId: '', itemType: 'chemical', qty: '' });
                renderInputs();
            }));
        };

        el.querySelector('#btn-add-sh-input').addEventListener('click', () => {
            inputRows.push({ itemId: '', itemType: 'chemical', qty: '' });
            renderInputs();
        });

        el.querySelector('#btn-save-sh').addEventListener('click', () => {
            const validInputs = inputRows.filter(r => r.itemId && r.qty > 0);
            const outputKg = Number(el.querySelector('#sh-output-kg').value);
            if (validInputs.length === 0) { alert('Add at least one input material'); return; }
            if (!outputKg || outputKg <= 0) { alert('Enter valid output kg'); return; }

            db.addSheetMakingBatch({
                date: el.querySelector('#sh-date').value,
                productionType: el.querySelector('#sh-type').value,
                inputItems: validInputs,
                outputKg,
                operatorName: el.querySelector('#sh-operator').value,
                narration: el.querySelector('#sh-narration').value
            });

            alert('Sheet Making Entry Saved!');
            inputRows = [{ itemId: '', itemType: 'chemical', qty: '' }];
            render();
        });

        renderInputs();
    };

    const renderHistory = (el) => {
        const batches = db.getProductionBatches('sheet');
        el.innerHTML = `
          <div class="card">
            <div class="section-header"><div class="section-title">Sheet Making Batch History</div></div>
            <div class="table-responsive">
              <table class="table">
                <thead><tr><th>Date</th><th>Type</th><th>Inputs</th><th class="text-right">Output (Kg)</th><th>Operator</th><th>Remarks</th></tr></thead>
                <tbody>
                  ${batches.map(b => {
                    const inputSummary = (b.inputItems || []).map(inp => {
                      const ch = db.data.chemicals.find(c => c.id === inp.itemId);
                      const st = db.data.sheetTypes.find(s => s.id === inp.itemId);
                      const name = ch?.name || st?.name || (inp.itemId === 'waste_nonsilicon' ? 'Waste' : inp.itemId);
                      return `${name}: ${inp.qty}Kg`;
                    }).join(', ');
                    return `<tr>
                      <td>${b.date}</td>
                      <td><span class="badge badge-${b.productionType==='silicon'?'info':'warning'}">${b.productionType}</span></td>
                      <td class="text-sm">${inputSummary || '-'}</td>
                      <td class="text-right font-bold">${b.outputKg}</td>
                      <td>${b.operatorName || '-'}</td>
                      <td class="text-sm text-muted">${b.narration || '-'}</td>
                    </tr>`;
                  }).join('')}
                  ${batches.length===0?'<tr><td colspan="6" class="text-center text-muted">No batches yet</td></tr>':''}
                </tbody>
              </table>
            </div>
          </div>
        `;
    };

    render();
    return c;
}
