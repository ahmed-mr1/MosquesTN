import React from 'react';
import CodeBlock from '../components/CodeBlock';
import { Edit3, Users } from 'lucide-react';

const Edits = () => {
    return (
        <div>
            <h1>Edit Proposals <span className="role-badge user">User</span></h1>
            <p>
                Edit Proposals allow authenticated users to suggest changes to existing mosque entries.
                The community can verify these edits through confirmations before moderators review them.
            </p>

            <div className="alert-box alert-info">
                <strong>How Edit Proposals Work</strong>
                <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    <li>A user submits an edit suggestion for a mosque</li>
                    <li>Other users can confirm the edit if they verify the information</li>
                    <li>Moderators review and approve edits with sufficient confirmations</li>
                    <li>Approved edits update the mosque entry</li>
                </ol>
            </div>

            {/* Submit Edit */}
            <div className="section">
                <h2>Submit Edit Proposal</h2>
                <div className="endpoint-badge post">POST /suggestions/mosques/:id/edits</div>
                <p><strong>Requires Authentication.</strong> Propose an edit to an existing mosque.</p>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`POST https://mosquestn-api.azurewebsites.net/suggestions/mosques/1/edits
Authorization: Bearer <your_token>
Content-Type: application/json`} />

                <h4>Payload</h4>
                <p>
                    The <code>patch</code> object contains only the fields you want to update.
                    You can update any combination of the following fields:
                </p>
                <CodeBlock code={`{
  "patch": {
    "arabic_name": "Updated Name",
    "address": "New Address",
    "latitude": 36.8,
    "longitude": 10.15,
    "facilities": {
      "parking": true,
      "wheelchair_access": true
    },
    "iqama_times": {
      "fajr": "+25",
      "dhuhr": "+15"
    },
    "muazzin_name": "Sheikh Ahmed"
  }
}`} />

                <h4>Editable Fields</h4>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Field</th>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td><code>arabic_name</code></td><td>string</td><td>Mosque name in Arabic</td></tr>
                        <tr><td><code>type</code></td><td>string</td><td>مسجد (Masjid), جامع (Jami), or مصلى (Musalla)</td></tr>
                        <tr><td><code>governorate</code></td><td>string</td><td>Governorate</td></tr>
                        <tr><td><code>delegation</code></td><td>string</td><td>Delegation</td></tr>
                        <tr><td><code>city</code></td><td>string</td><td>City</td></tr>
                        <tr><td><code>address</code></td><td>string</td><td>Street address</td></tr>
                        <tr><td><code>latitude</code></td><td>float</td><td>GPS Latitude</td></tr>
                        <tr><td><code>longitude</code></td><td>float</td><td>GPS Longitude</td></tr>
                        <tr><td><code>facilities</code></td><td>object</td><td>Boolean map of facilities</td></tr>
                        <tr><td><code>iqama_times</code></td><td>object</td><td>Prayer times (e.g., <code>fajr: "+20"</code>)</td></tr>
                        <tr><td><code>muazzin_name</code></td><td>string</td><td>Muazzin name</td></tr>
                        <tr><td><code>imam_5_prayers_name</code></td><td>string</td><td>Imam for 5 prayers</td></tr>
                        <tr><td><code>imam_jumua_name</code></td><td>string</td><td>Friday prayer Imam</td></tr>
                    </tbody>
                </table>

                <h4>Example Response</h4>
                <CodeBlock code={`{
  "id": 23,
  "mosque_id": 1,
  "status": "pending_approval",
  "confirmations_count": 0,
  "created_at": "2023-10-20T15:45:00Z"
}`} />
            </div>

            {/* Confirm Edit */}
            <div className="section">
                <h2>Confirm Edit Proposal</h2>
                <div className="endpoint-badge post">POST /suggestions/edits/:id/confirmations</div>
                <p><strong>Requires Authentication.</strong> Confirm that an edit proposal is accurate.</p>

                <div className="alert-box alert-success">
                    <strong><Users size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />Community Verification</strong>
                    <p>When users confirm edits, it builds trust in the data. Each user can only confirm once per edit.</p>
                </div>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`POST https://mosquestn-api.azurewebsites.net/suggestions/edits/23/confirmations
Authorization: Bearer <your_token>`} />

                <h4>Example Response</h4>
                <CodeBlock code={`{
  "id": 23,
  "confirmations_count": 1,
  "status": "pending_approval"
}`} />
            </div>
        </div>
    );
};

export default Edits;
