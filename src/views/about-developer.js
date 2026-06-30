export default function AboutDeveloperView() {
  const c = document.createElement('div');
  c.className = 'animate-fade-in';

  c.innerHTML = `
    <div class="container" style="max-width: 900px; margin: 0 auto; padding: 2rem;">
      <div class="card" style="margin-bottom: 2rem;">
        <div class="section-header">
          <div class="section-title" style="font-size: 1.75rem; font-weight: 700;">
            <i class="ph ph-user-circle" style="margin-right: 0.5rem; color: var(--accent-primary);"></i>
            About Developer
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 2rem;">
        <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem;">
          <img src="https://media.licdn.com/dms/image/v2/D5603AQGmkMRVKGlBUg/profile-displayphoto-scale_400_400/B56Z3kSVfwKgAg-/0/1777651520496?e=1784160000&v=beta&t=kk3Rg9lJBXv4eI6WuWkzF88m8XgI0-aDKINUL2QNY04" 
               alt="Abhishek Tiwari" 
               style="
                 width: 120px;
                 height: 120px;
                 border-radius: 50%;
                 object-fit: cover;
                 border: 4px solid var(--accent-primary);
                 box-shadow: 0 4px 12px rgba(0,0,0,0.1);
               ">
          <div>
            <h2 style="margin: 0 0 0.5rem 0; font-size: 1.75rem; font-weight: 700;">Abhishek Tiwari</h2>
            <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary); font-size: 1.1rem;">
              <i class="ph ph-briefcase" style="margin-right: 0.5rem;"></i>
              Full Stack Developer
            </p>
            <p style="margin: 0; color: var(--text-secondary);">
              <i class="ph ph-map-pin" style="margin-right: 0.5rem;"></i>
              India
            </p>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
          <h3 style="margin: 0 0 1rem 0; font-size: 1.25rem; font-weight: 600;">
            <i class="ph ph-info" style="margin-right: 0.5rem; color: var(--accent-primary);"></i>
            About Me
          </h3>
          <p style="line-height: 1.8; color: var(--text-secondary); margin-bottom: 1rem;">
            Passionate and skilled Full Stack Developer with expertise in building modern web applications. 
            Specialized in JavaScript, React, Node.js, and database management. Committed to creating 
            efficient, scalable, and user-friendly solutions.
          </p>
          <p style="line-height: 1.8; color: var(--text-secondary);">
            This ERP system (ProductionERP) is designed specifically for rubber manufacturing businesses, 
            providing comprehensive solutions for inventory management, production tracking, sales, 
            purchases, GST compliance, and financial reporting.
          </p>
        </div>
      </div>

      <div class="card" style="margin-bottom: 2rem;">
        <div class="section-header">
          <div class="section-title" style="font-size: 1.25rem; font-weight: 600;">
            <i class="ph ph-code" style="margin-right: 0.5rem; color: var(--accent-primary);"></i>
            Technical Skills
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
          <div style="padding: 1rem; background: var(--bg-body); border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 0.5rem;">Frontend</div>
            <div style="color: var(--text-secondary); font-size: 0.9rem;">JavaScript, React, HTML5, CSS3, Vite</div>
          </div>
          <div style="padding: 1rem; background: var(--bg-body); border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 0.5rem;">Backend</div>
            <div style="color: var(--text-secondary); font-size: 0.9rem;">Node.js, Express.js, REST APIs</div>
          </div>
          <div style="padding: 1rem; background: var(--bg-body); border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 0.5rem;">Database</div>
            <div style="color: var(--text-secondary); font-size: 0.9rem;">SQLite, PostgreSQL, Supabase</div>
          </div>
          <div style="padding: 1rem; background: var(--bg-body); border-radius: 8px;">
            <div style="font-weight: 600; margin-bottom: 0.5rem;">Tools & Others</div>
            <div style="color: var(--text-secondary); font-size: 0.9rem;">Git, Docker, Jest, Playwright</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom: 2rem;">
        <div class="section-header">
          <div class="section-title" style="font-size: 1.25rem; font-weight: 600;">
            <i class="ph ph-lightning" style="margin-right: 0.5rem; color: var(--accent-primary);"></i>
            Project Highlights
          </div>
        </div>
        <ul style="line-height: 1.8; color: var(--text-secondary); margin-top: 1rem; padding-left: 1.5rem;">
          <li style="margin-bottom: 0.5rem;">
            <strong>ProductionERP</strong> - Complete ERP solution for rubber manufacturing industry
          </li>
          <li style="margin-bottom: 0.5rem;">
            <strong>Production Management</strong> - Stage-wise production tracking (Sheet Making & Product Making)
          </li>
          <li style="margin-bottom: 0.5rem;">
            <strong>Inventory Control</strong> - Real-time stock monitoring with low-stock alerts
          </li>
          <li style="margin-bottom: 0.5rem;">
            <strong>Financial Management</strong> - GST compliance, accounts, expenses, and reporting
          </li>
          <li style="margin-bottom: 0.5rem;">
            <strong>Sales & Purchase</strong> - Complete order management with challans and returns
          </li>
        </ul>
      </div>

      <div class="card">
        <div class="section-header">
          <div class="section-title" style="font-size: 1.25rem; font-weight: 600;">
            <i class="ph ph-link" style="margin-right: 0.5rem; color: var(--accent-primary);"></i>
            Connect With Me
          </div>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
          <a href="https://github.com/coder-abhishektiwari" target="_blank" rel="noopener noreferrer" 
             style="
               display: inline-flex;
               align-items: center;
               gap: 0.5rem;
               padding: 0.75rem 1.25rem;
               background: var(--bg-body);
               border: 1px solid var(--border-color);
               border-radius: 8px;
               text-decoration: none;
               color: var(--text-primary);
               transition: all 0.2s;
             "
             onmouseover="this.style.background='var(--accent-primary)'; this.style.color='white'; this.style.borderColor='var(--accent-primary)';"
             onmouseout="this.style.background='var(--bg-body)'; this.style.color='var(--text-primary)'; this.style.borderColor='var(--border-color)';">
            <i class="ph ph-github-logo" style="font-size: 1.25rem;"></i>
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/-tiwari-abhishek/" target="_blank" rel="noopener noreferrer"
             style="
               display: inline-flex;
               align-items: center;
               gap: 0.5rem;
               padding: 0.75rem 1.25rem;
               background: var(--bg-body);
               border: 1px solid var(--border-color);
               border-radius: 8px;
               text-decoration: none;
               color: var(--text-primary);
               transition: all 0.2s;
             "
             onmouseover="this.style.background='#0077B5'; this.style.color='white'; this.style.borderColor='#0077B5';"
             onmouseout="this.style.background='var(--bg-body)'; this.style.color='var(--text-primary)'; this.style.borderColor='var(--border-color)';">
            <i class="ph ph-linkedin-logo" style="font-size: 1.25rem;"></i>
            LinkedIn
          </a>
          <a href="mailto:abhishektiwari1706@gmail.com"
             style="
               display: inline-flex;
               align-items: center;
               gap: 0.5rem;
               padding: 0.75rem 1.25rem;
               background: var(--bg-body);
               border: 1px solid var(--border-color);
               border-radius: 8px;
               text-decoration: none;
               color: var(--text-primary);
               transition: all 0.2s;
             "
             onmouseover="this.style.background='var(--accent-success)'; this.style.color='white'; this.style.borderColor='var(--accent-success)';"
             onmouseout="this.style.background='var(--bg-body)'; this.style.color='var(--text-primary)'; this.style.borderColor='var(--border-color)';">
            <i class="ph ph-envelope" style="font-size: 1.25rem;"></i>
            Email
          </a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 3rem; padding: 1.5rem; color: var(--text-secondary);">
        <p style="margin: 0; font-size: 0.9rem;">
          © ${new Date().getFullYear()} ProductionERP | Developed with <i class="ph ph-heart" style="color: var(--accent-danger);"></i> by Abhishek Tiwari
        </p>
        <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem;">
          Version 3.0-supabase
        </p>
      </div>
    </div>
  `;

  return c;
}