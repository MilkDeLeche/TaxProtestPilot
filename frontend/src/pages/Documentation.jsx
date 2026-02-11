import { Link } from 'react-router-dom';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { Footer } from '../components/landing/Footer';

export default function Documentation() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <LandingNavbar />

      {/* Hero – Technical Specifications (light, as before) */}
      <div className="bg-white dark:bg-gray-900">
        <div aria-hidden="true" className="relative">
          <img src="/images/homepage.png" alt="" className="h-96 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900" />
        </div>

        <div className="relative mx-auto -mt-12 max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center lg:max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">Technical Specifications</h2>
            <p className="mt-4 text-gray-500 dark:text-gray-400">How the dashboard gets data from your CSV, how to format it, and how to go from upload to QuickBooks-ready export. Prepare your file, map columns, calculate, save, and export.</p>
          </div>

          <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-y-16 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <dt className="font-medium text-gray-900 dark:text-white">Origin</dt>
              <dd className="mt-2 text-sm text-gray-500 dark:text-gray-400">Prepare your file: CSV or export from Excel. First row must be headers. You need at least Notice Value and Final Value; include Owner Name and Property ID for best results. We auto-detect common column names.</dd>
            </div>
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <dt className="font-medium text-gray-900 dark:text-white">Material</dt>
              <dd className="mt-2 text-sm text-gray-500 dark:text-gray-400">Upload & map columns in Upload & Calculate. Drag and drop your CSV; Map Your Columns shows four dropdowns. We guess from headers—change any dropdown if needed. At least Notice Value and Final Value must be mapped.</dd>
            </div>
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <dt className="font-medium text-gray-900 dark:text-white">Dimensions</dt>
              <dd className="mt-2 text-sm text-gray-500 dark:text-gray-400">Click Calculate Savings. The app uses your Settings to compute tax savings, your fee, client net, and Recommend review per row. Results table and summary appear. Export CSV here or Save the batch.</dd>
            </div>
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <dt className="font-medium text-gray-900 dark:text-white">Finish</dt>
              <dd className="mt-2 text-sm text-gray-500 dark:text-gray-400">When signed in, add optional Notes and click Save. The batch is stored and you’re taken to Saved Uploads. Only saved batches can be exported in QuickBooks format and edited (e.g. manual discounts) later.</dd>
            </div>
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <dt className="font-medium text-gray-900 dark:text-white">Includes</dt>
              <dd className="mt-2 text-sm text-gray-500 dark:text-gray-400">In Saved Uploads, click Open & export on a batch. Optionally enter manual discounts per row. Export to download a QuickBooks-ready CSV. Import in QuickBooks via File → Import.</dd>
            </div>
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <dt className="font-medium text-gray-900 dark:text-white">Considerations</dt>
              <dd className="mt-2 text-sm text-gray-500 dark:text-gray-400">Tax rate %, contingency %, flat fee, minimum savings, and QuickBooks labels (item name, description prefix, next invoice number) are set in Settings and apply to all new calculations and exports.</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Section 2 – Deploy faster (your section: grid + sticky image + list, deep blue, no demo) */}
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a] px-6 py-24 sm:py-32 lg:overflow-visible lg:px-0">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <svg aria-hidden="true" className="absolute top-0 left-[max(50%,25rem)] h-[64rem] w-[128rem] -translate-x-1/2 mask-[radial-gradient(64rem_64rem_at_top,white,transparent)] stroke-white/10">
            <defs>
              <pattern id="e813992c-7d03-4cc4-a2bd-151760b470a0" width="200" height="200" x="50%" y="-1" patternUnits="userSpaceOnUse">
                <path d="M100 200V.5M.5 .5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y="-1" className="overflow-visible fill-white/5">
              <path d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z" strokeWidth="0" />
            </svg>
            <rect width="100%" height="100%" fill="url(#e813992c-7d03-4cc4-a2bd-151760b470a0)" strokeWidth="0" />
          </svg>
        </div>
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-y-10">
          <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
            <div className="lg:pr-4">
              <div className="lg:max-w-lg">
                <p className="text-base/7 font-semibold text-blue-300">Deploy faster</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-white sm:text-5xl">A better workflow</h1>
                <p className="mt-6 text-xl/8 text-white/90">From your spreadsheet to QuickBooks: upload a CSV, map your columns (we auto-detect them), run the savings calculator, save the batch, and export. One workflow from data to invoices.</p>
              </div>
            </div>
          </div>
          <div className="-mt-12 -ml-12 p-12 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:overflow-hidden">
            <img src="/images/demohero.png" alt="" className="w-3xl max-w-none rounded-xl bg-gray-900 shadow-xl ring-1 ring-white/10 sm:w-[57rem]" />
          </div>
          <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:mx-auto lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
            <div className="lg:pr-4">
              <div className="max-w-xl text-base/7 text-white/90 lg:max-w-lg">
                <p>Prepare a CSV with at least Notice Value and Final Value (and optionally Owner Name, Property ID). Go to Upload &amp; Calculate, drag and drop your file, then use the column dropdowns to map each field. We suggest mappings from your headers—adjust any dropdown if the guess is wrong.</p>
                <ul role="list" className="mt-8 space-y-8 text-white/90">
                  <li className="flex gap-x-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="mt-1 size-5 flex-none text-white">
                      <path d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765 4.5 4.5 0 0 1 8.302-3.046 3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z" clipRule="evenodd" fillRule="evenodd" />
                    </svg>
                    <span><strong className="font-semibold text-white">Upload &amp; map.</strong> Drag and drop your CSV; we auto-map Notice Value, Final Value, Owner Name, and Property ID from your headers. Change any dropdown if needed. Then click Calculate Savings.</span>
                  </li>
                  <li className="flex gap-x-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="mt-1 size-5 flex-none text-white">
                      <path d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" fillRule="evenodd" />
                    </svg>
                    <span><strong className="font-semibold text-white">Save the batch.</strong> When signed in, add optional notes and click Save. Your batch appears under Saved Uploads so you can export to QuickBooks or edit manual discounts later.</span>
                  </li>
                  <li className="flex gap-x-3">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="mt-1 size-5 flex-none text-white">
                      <path d="M4.632 3.533A2 2 0 0 1 6.577 2h6.846a2 2 0 0 1 1.945 1.533l1.976 8.234A3.489 3.489 0 0 0 16 11.5H4c-.476 0-.93.095-1.344.267l1.976-8.234Z" />
                      <path d="M4 13a2 2 0 1 0 0 4h12a2 2 0 1 0 0-4H4Zm11.24 2a.75.75 0 0 1 .75-.75H16a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75h-.01a.75.75 0 0 1-.75-.75V15Zm-2.25-.75a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75H13a.75.75 0 0 0 .75-.75V15a.75.75 0 0 0-.75-.75h-.01Z" clipRule="evenodd" fillRule="evenodd" />
                    </svg>
                    <span><strong className="font-semibold text-white">Export to QuickBooks.</strong> In Saved Uploads, open a batch and use the export button to download a QuickBooks-ready CSV. Import it in QuickBooks via File → Import. Invoice numbers and labels come from your Settings.</span>
                  </li>
                </ul>
                <p className="mt-8">Your Settings (tax rate %, contingency %, flat fee, minimum savings, and QuickBooks labels) apply to every new calculation and export. Set them once and they’re used until you change them.</p>
                <h2 className="mt-16 text-2xl font-bold tracking-tight text-white">No server? No problem.</h2>
                <p className="mt-6">Sign in with Google or email to save batches and export to QuickBooks.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 – FAQ (plain dl grid, no cards; blue Support link, no demo) */}
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl" style={{ fontFamily: 'Manrope, sans-serif' }}>Frequently asked questions</h2>
            <p className="mt-4 text-lg text-gray-600">Have a different question? Reach out via the <Link to="/support" className="font-semibold text-[#1e40af] hover:text-[#1e3a8a]">Support</Link> page.</p>
          </div>
          <dl className="mx-auto mt-20 grid max-w-2xl grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 lg:max-w-none lg:grid-cols-3 lg:gap-x-10">
            <div>
              <dt className="text-base font-semibold leading-7 text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>What CSV columns does Tax Protest Pilot need?</dt>
              <dd className="mt-4 text-base leading-7 text-gray-600">At least <strong>Notice Value</strong> and <strong>Final Value</strong>. Owner Name and Property ID are optional but recommended. The app auto-detects common headers and lets you map columns via dropdowns if the guess is wrong.</dd>
            </div>
            <div>
              <dt className="text-base font-semibold leading-7 text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>How do I get started?</dt>
              <dd className="mt-4 text-base leading-7 text-gray-600">Sign in with Google or email on the login page. Then go to Upload &amp; Calculate to upload a CSV, map columns, run the calculator, and save batches. Export from Saved Uploads when you're ready for QuickBooks.</dd>
            </div>
            <div>
              <dt className="text-base font-semibold leading-7 text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>How is the fee calculated?</dt>
              <dd className="mt-4 text-base leading-7 text-gray-600">Tax savings = (Notice Value − Final Value) × tax rate %. Your fee uses the contingency % and/or flat fee from Settings, with optional minimum savings and &quot;charge flat if no win.&quot; The calculator shows per-row and totals before you save.</dd>
            </div>
            <div>
              <dt className="text-base font-semibold leading-7 text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Where do Settings apply?</dt>
              <dd className="mt-4 text-base leading-7 text-gray-600">Tax rate, contingency %, flat fee, minimum savings, and QuickBooks labels apply to every new calculation and export. Change them in Settings anytime; they apply to the next upload and batch.</dd>
            </div>
            <div>
              <dt className="text-base font-semibold leading-7 text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>Why don't I see the Save button?</dt>
              <dd className="mt-4 text-base leading-7 text-gray-600">Save appears when you're signed in. Sign in with Google or email to save batches and export QuickBooks-ready CSV from Saved Uploads.</dd>
            </div>
            <div>
              <dt className="text-base font-semibold leading-7 text-gray-900" style={{ fontFamily: 'Manrope, sans-serif' }}>How do I import into QuickBooks?</dt>
              <dd className="mt-4 text-base leading-7 text-gray-600">Export a batch from Saved Uploads to download a CSV. In QuickBooks, go to <strong>File → Import</strong> and choose the file. The CSV includes invoice number, customer, dates, item, and amount.</dd>
            </div>
          </dl>
        </div>
      </div>


      <Footer />
    </div>
  );
}
