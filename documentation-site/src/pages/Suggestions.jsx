import React from 'react';
import CodeBlock from '../components/CodeBlock';
import { Users } from 'lucide-react';

const Suggestions = () => {
    return (
        <div>
            <h1>Suggestions Endpoints <span className="role-badge user">User</span></h1>
            <p>
                The Suggestions resource allows users to contribute to the database by suggesting new mosques.
                These suggestions are moderated before being approved.
            </p>

            <div className="alert-box alert-info">
                <strong>AI Moderation & Community Verification</strong>
                <p>
                    All suggestions are automatically screened by AI for inappropriate content.
                    Users can confirm valid suggestions to expedite approval.
                </p>
            </div>

            {/* Create Suggestion */}
            <div className="section">
                <h2>Create Suggestion</h2>
                <div className="endpoint-badge post">POST /suggestions/mosques</div>
                <p><strong>Requires Authentication.</strong> Submit a new mosque for approval.</p>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`POST https://mosquestn-api.azurewebsites.net/suggestions/mosques
Authorization: Bearer <your_token>
Content-Type: application/json`} />

                <h4>Payload</h4>
                <CodeBlock code={`{
  "arabic_name": "مسجد النور",
  "governorate": "Tunis",
  "city": "Le Bardo",
  "type": "مسجد",
  "latitude": 36.8093,
  "longitude": 10.1413,
  "address": "Avenue Habib Bourguiba",
  "facilities": {
    "parking": true,
    "wheelchair_access": false,
    "air_conditioning": true
  },
  "iqama_times": {
    "fajr": "+25"
  }
}`} />

                <table className="table" style={{ marginTop: '1rem' }}>
                    <thead>
                        <tr>
                            <th>Field</th>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td><code>arabic_name</code></td><td>string</td><td>Name of the mosque in Arabic</td></tr>
                        <tr><td><code>governorate</code></td><td>string</td><td><strong>Required.</strong></td></tr>
                        <tr><td><code>city</code></td><td>string</td><td>City name</td></tr>
                        <tr><td><code>type</code></td><td>string</td><td>مسجد (Masjid), جامع (Jami), or مصلى (Musalla)</td></tr>
                        <tr><td><code>latitude</code></td><td>float</td><td>GPS Latitude</td></tr>
                        <tr><td><code>longitude</code></td><td>float</td><td>GPS Longitude</td></tr>
                        <tr><td><code>facilities</code></td><td>object</td><td>Key-value pairs (e.g., <code>{`{"parking": true }`}</code>)</td></tr>
                    </tbody>
                </table>

                <h4>Example Response (201 Created)</h4>
                <CodeBlock code={`{
  "id": 45,
  "arabic_name": "مسجد النور",
  "status": "pending_approval",
  "message": "Suggestion created successfully"
}`} />
            </div>

            {/* Confirm Suggestion */}
            <div className="section">
                <h2>Confirm Suggestion</h2>
                <div className="endpoint-badge post">POST /suggestions/:id/confirmations</div>
                <p><strong>Requires Authentication.</strong> Confirm that a mosque suggestion is valid and accurate.</p>

                <div className="alert-box alert-success">
                    <strong><Users size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />Community-Driven Approval</strong>
                    <p>
                        When a suggestion receives enough confirmations from the community, it can be automatically approved.
                        Each user can only confirm a suggestion once.
                    </p>
                </div>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`POST https://mosquestn-api.azurewebsites.net/suggestions/45/confirmations
Authorization: Bearer <your_token>`} />

                <h4>Example Response</h4>
                <CodeBlock code={`{
  "id": 45,
  "confirmations_count": 3,
  "status": "pending_approval"
}`} />
            </div>

            {/* List My Suggestions */}
            <div className="section">
                <h2>List My Suggestions</h2>
                <div className="endpoint-badge get">GET /suggestions/mosques</div>
                <p><strong>Requires Authentication.</strong> Retrieve suggestions submitted by the current user.</p>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`GET https://mosquestn-api.azurewebsites.net/suggestions/mosques
Authorization: Bearer <your_token>`} />

                <h4>Example Response</h4>
                <CodeBlock code={`[
  {
    "id": 45,
    "arabic_name": "مسجد النور",
    "status": "pending_approval",
    "confirmations_count": 3,
    "createdAt": "2023-01-01T12:00:00Z"
  },
  {
    "id": 32,
    "arabic_name": "Another Mosque",
    "status": "approved",
    "confirmations_count": 5,
    "createdAt": "2022-12-15T09:30:00Z"
  }
]`} />
            </div>
        </div>
    );
};

export default Suggestions;
