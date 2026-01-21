import React from 'react';
import CodeBlock from '../components/CodeBlock';

const Mosques = () => {
  return (
    <div>
      <h1>Mosques Endpoints</h1>
      <p>
        The Mosques resource represents the core data of the application.
        You can list, search, and retrieve details for mosques.
      </p>

      {/* List Mosques */}
      <div className="section">
        <h2>List Mosques</h2>
        <div className="endpoint-badge get">GET /mosques</div>
        <p>Retrieve a paginated list of mosques with optional filtering.</p>

        <h4>Example Request</h4>
        <p>Get all مسجد (Masjid) mosques in Tunis:</p>
        <CodeBlock language="bash" code="GET https://mosquestn-api.azurewebsites.net/mosques?governorate=Tunis&type=مسجد" />

        <h4>Query Parameters</h4>
        <table className="table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>governorate</code></td><td>string</td><td>Filter by governorate name</td></tr>
            <tr><td><code>city</code></td><td>string</td><td>Filter by city name</td></tr>
            <tr><td><code>type</code></td><td>string</td><td>Filter by type (مسجد for Masjid, جامع for Jami, مصلى for Musalla)</td></tr>
            <tr><td><code>search</code></td><td>string</td><td>Search by arabic name (partial match)</td></tr>
            <tr><td><code>limit</code></td><td>integer</td><td>Max items to return (default: 20, max: 500)</td></tr>
            <tr><td><code>offset</code></td><td>integer</td><td>Pagination offset (default: 0)</td></tr>
          </tbody>
        </table>

        <h4>Example Response</h4>
        <CodeBlock code={`[
  {
    "id": 1,
    "arabic_name": "جامع الزيتونة",
    "governorate": "Tunis",
    "city": "Medina",
    "type": "جامع",
    "latitude": 36.797,
    "longitude": 10.171,
    "approved": true
  },
  {
    "id": 2,
    "arabic_name": "جامع القصبة",
    "governorate": "Tunis",
    "city": "Medina",
    "type": "جامع",
    "latitude": 36.796,
    "longitude": 10.168,
    "approved": true
  }
]`} />
      </div>

      {/* Get Mosque */}
      <div className="section">
        <h2>Get Mosque Details</h2>
        <div className="endpoint-badge get">GET /mosques/:id</div>
        <p>Retrieve detailed information about a specific mosque.</p>

        <h4>Example Request</h4>
        <CodeBlock language="bash" code="GET https://mosquestn-api.azurewebsites.net/mosques/1" />

        <h4>Example Response</h4>
        <CodeBlock code={`{
  "id": 1,
  "arabic_name": "جامع الزيتونة",
  "type": "جامع",
  "governorate": "Tunis",
  "delegation": "Medina",
  "city": "Medina",
  "address": "30 Rue Jemaa Ezzitouna",
  "latitude": 36.797,
  "longitude": 10.171,
  "image_url": "https://example.com/zitouna.jpg",
  "facilities": {
    "parking": false,
    "wheelchair_access": true,
    "women_prayer_area": true,
    "restrooms": true
  },
  "iqama_times": {
    "fajr": "+20",
    "dhuhr": "+15",
    "asr": "+15",
    "maghrib": "+5",
    "isha": "+15"
  },
  "muazzin_name": "Sheikh Ahmed",
  "approved": true,
  "created_at": "2023-01-01T12:00:00Z"
}`} />
      </div>

      {/* Nearby Mosques */}
      <div className="section">
        <h2>Nearby Mosques</h2>
        <div className="endpoint-badge get">GET /mosques/nearby</div>
        <p>Find mosques within a certain radius of a coordinate.</p>

        <h4>Example Request</h4>
        <p>Find mosques within 2km of a location in Sousse:</p>
        <CodeBlock language="bash" code="GET https://mosquestn-api.azurewebsites.net/mosques/nearby?lat=35.82&lng=10.63&radius=2" />

        <h4>Query Parameters</h4>
        <table className="table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>lat</code></td><td>float</td><td><strong>Required.</strong> Latitude</td></tr>
            <tr><td><code>lng</code></td><td>float</td><td><strong>Required.</strong> Longitude</td></tr>
            <tr><td><code>radius</code></td><td>float</td><td>Search radius in KM (default: 5)</td></tr>
          </tbody>
        </table>

        <h4>Example Response</h4>
        <CodeBlock code={`[
  {
    "id": 5,
    "arabic_name": "جامع سوسة الكبير",
    "latitude": 35.825,
    "longitude": 10.638,
    "type": "جامع",
    "governorate": "Sousse"
  }
]`} />
      </div>

      {/* Pending Suggestions */}
      <div className="section">
        <h2>Public Suggestions (Pending)</h2>
        <div className="endpoint-badge get">GET /mosques/suggestions/public</div>
        <p>Retrieve a list of pending suggestions that public users can help verify.</p>

        <h4>Example Request</h4>
        <CodeBlock language="bash" code="GET https://mosquestn-api.azurewebsites.net/mosques/suggestions/public" />

        <h4>Example Response</h4>
        <CodeBlock code={`[
  {
    "id": 12,
    "arabic_name": "Proposed Mosque",
    "status": "pending_approval",
    "governorate": "Sousse",
    "created_at": "2023-10-25T09:00:00Z"
  }
]`} />
      </div>
    </div>
  );
};

export default Mosques;
