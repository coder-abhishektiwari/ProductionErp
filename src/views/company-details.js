import { db } from '../store/db.js';

export default function CompanyDetailsView() {
    const c = document.createElement('div');
    c.className = 'animate-fade-in card mx-auto';
    c.style.maxWidth = '1000px';

    const render = () => {
        const info = db.data.companyInfo || {};
        c.innerHTML = `
            <div class="section-header flex justify-between items-center mb-6">
                <div class="section-title text-2xl"><i class="ph ph-buildings text-primary"></i> Business Configuration</div>
                <button class="btn btn-primary" id="btn-save-ci"><i class="ph ph-floppy-disk"></i> Save Changes</button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Organization Identity -->
                <div class="space-y-4">
                    <h3 class="font-bold border-b pb-2 flex items-center gap-2"><i class="ph ph-identification-card"></i> Identity & Contact</h3>
                    <div class="form-group">
                        <label class="form-label">Full Commercial Name</label>
                        <input class="form-control" id="ci-name" value="${info.name || ''}" placeholder="E.g. ABC Rubber North Ltd.">
                    </div>
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">GSTIN (Registration)</label>
                            <input class="form-control" id="ci-gstin" value="${info.gstin || ''}" placeholder="27AABCA1234B1Z5">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email Address</label>
                            <input class="form-control" id="ci-email" value="${info.email || ''}" placeholder="info@company.com">
                        </div>
                    </div>
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Landed Phone</label>
                            <input class="form-control" id="ci-phone" value="${info.phone || ''}" placeholder="+91 20 1234567">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Website (URL)</label>
                            <input class="form-control" id="ci-website" value="${info.website || ''}" placeholder="www.company.com">
                        </div>
                    </div>
                </div>

                <!-- Address & Region -->
                <div class="space-y-4">
                    <h3 class="font-bold border-b pb-2 flex items-center gap-2"><i class="ph ph-map-pin"></i> Location & Regional Codes</h3>
                    <div class="form-group">
                        <label class="form-label">Physical Street Address</label>
                        <textarea class="form-control" id="ci-addr" style="height:80px">${info.address || ''}</textarea>
                    </div>
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Pincode / ZIP</label>
                            <input class="form-control" id="ci-pin" value="${info.pincode || ''}" placeholder="411026">
                        </div>
                        <div class="form-group">
                            <label class="form-label">State Name</label>
                            <input class="form-control" id="ci-state" value="${info.state || ''}" placeholder="Maharashtra">
                        </div>
                    </div>
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">State Code</label>
                            <input class="form-control" id="ci-state-code" value="${info.stateCode || ''}" placeholder="27">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Country</label>
                            <input class="form-control" id="ci-country" value="${info.country || 'India'}">
                        </div>
                    </div>
                    <div class="form-group">
                         <label class="form-label">Country Code</label>
                         <input class="form-control" id="ci-country-code" value="${info.countryCode || 'IN'}">
                    </div>
                </div>

                <!-- Banking Details -->
                <div class="space-y-4 md:col-span-2">
                    <h3 class="font-bold border-b pb-2 flex items-center gap-2"><i class="ph ph-bank"></i> Banking Information (For Invoices)</h3>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="form-group">
                            <label class="form-label">Bank Name</label>
                            <input class="form-control" id="ci-bank-name" value="${info.bankName || ''}" placeholder="HDFC Bank">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Account Number</label>
                            <input class="form-control" id="ci-bank-acc" value="${info.bankAcc || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">IFSC Code</label>
                            <input class="form-control" id="ci-bank-ifsc" value="${info.bankIfsc || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Branch Name</label>
                            <input class="form-control" id="ci-bank-branch" value="${info.bankBranch || ''}">
                        </div>
                    </div>
                </div>
            </div>
        `;

        c.querySelector('#btn-save-ci').addEventListener('click', () => {
            const up = {
                name: c.querySelector('#ci-name').value,
                gstin: c.querySelector('#ci-gstin').value,
                email: c.querySelector('#ci-email').value,
                phone: c.querySelector('#ci-phone').value,
                website: c.querySelector('#ci-website').value,
                address: c.querySelector('#ci-addr').value,
                pincode: c.querySelector('#ci-pin').value,
                state: c.querySelector('#ci-state').value,
                stateCode: c.querySelector('#ci-state-code').value,
                country: c.querySelector('#ci-country').value,
                countryCode: c.querySelector('#ci-country-code').value,
                bankName: c.querySelector('#ci-bank-name').value,
                bankAcc: c.querySelector('#ci-bank-acc').value,
                bankIfsc: c.querySelector('#ci-bank-ifsc').value,
                bankBranch: c.querySelector('#ci-bank-branch').value,
            };
            db.data.companyInfo = up;
            db.saveData();
            // Update local storage name too if changed
            if (up.name) localStorage.setItem('company_name', up.name);
            alert('Business Profile Synchronized!');
            window.location.reload(); // Refresh to update brand logo in header
        });
    };

    render();
    return c;
}
