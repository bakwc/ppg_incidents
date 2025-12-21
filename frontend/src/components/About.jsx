export default function About() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-amber-400 mb-8">About PPG Incidents</h1>
        
        <div className="space-y-6 text-slate-300">
          <section>
            <h2 className="text-2xl font-semibold text-slate-100 mb-4">Project Overview</h2>
            <p className="text-base leading-relaxed">
              This database tracks and analyzes paramotoring incidents to help improve safety in the sport. 
              By collecting and categorizing incident data, we aim to identify patterns and contributing factors 
              that can help pilots make better decisions and avoid dangerous situations.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-slate-100 mb-4">Data Sources</h2>
            <p className="text-base leading-relaxed mb-6">
              Incident reports are collected from various sources including pilot reports, safety organizations, 
              and publicly available incident databases. Each incident is reviewed and categorized to ensure 
              data quality and consistency.
            </p>
            
            <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
              <h3 className="text-lg font-medium text-slate-200 mb-4">Primary Sources:</h3>
              <div className="space-y-3">
                <div className="pl-4">
                  <a href="https://usppa.org" target="_blank" rel="noopener noreferrer" 
                     className="text-amber-400 hover:text-amber-300 font-medium">usppa.org</a>
                  <span className="text-slate-400 ml-2">— US Powered Paragliding Association</span>
                </div>
                <div className="pl-4">
                  <a href="https://www.bhpa.co.uk" target="_blank" rel="noopener noreferrer" 
                     className="text-amber-400 hover:text-amber-300 font-medium">bhpa.co.uk</a>
                  <span className="text-slate-400 ml-2">— British Hang Gliding and Paragliding Association</span>
                </div>
                <div className="pl-4">
                  <a href="https://www.bea.aero" target="_blank" rel="noopener noreferrer" 
                     className="text-amber-400 hover:text-amber-300 font-medium">bea.aero</a>
                  <span className="text-slate-400 ml-2">— French Aviation Accident Investigation Bureau</span>
                </div>
                <div className="pl-4">
                  <a href="https://aviation-safety.net" target="_blank" rel="noopener noreferrer" 
                     className="text-amber-400 hover:text-amber-300 font-medium">aviation-safety.net</a>
                </div>
                <div className="pl-4">
                  <a href="https://www.aaiib.gov.cy" target="_blank" rel="noopener noreferrer" 
                     className="text-amber-400 hover:text-amber-300 font-medium">aaiib.gov.cy</a>
                  <span className="text-slate-400 ml-2">— Cyprus Aviation</span>
                </div>
                <div className="pl-4">
                  <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" 
                     className="text-amber-400 hover:text-amber-300 font-medium">youtube.com</a>
                </div>
                <div className="pl-4 text-slate-400 italic">and others</div>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-slate-100 mb-4">How to Use</h2>
            <ul className="list-disc list-inside space-y-2 text-base">
              <li>Browse incidents using filters on the main page</li>
              <li>View detailed statistics and trends in the Dashboards section</li>
              <li>Click on any incident to see full details</li>
              <li>Use the search functionality to find specific incidents</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-slate-100 mb-4">Contributing</h2>
            <p className="text-base leading-relaxed">
              If you have information about an incident that is not in our database, please consider 
              contributing. Accurate incident reporting helps the entire paramotoring community learn 
              from past events and improve safety practices.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

