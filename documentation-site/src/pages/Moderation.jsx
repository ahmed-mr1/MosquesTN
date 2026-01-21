import React from 'react';
import CodeBlock from '../components/CodeBlock';
import { Shield, AlertCircle } from 'lucide-react';

const Moderation = () => {
    return (
        <div>
            <h1>Moderation Endpoints <span className="role-badge admin">Admin</span><span className="role-badge moderator">Moderator</span></h1>
            <p>
                These endpoints allow administrators and moderators to review, approve, and manage user-generated content.
                All moderation endpoints require authentication with an Admin or Moderator role.
            </p>

            <div className="alert-box alert-warning">
                <strong><AlertCircle size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />Authentication Required</strong>
                <p>All moderation endpoints require a JWT token with <code>role: "admin"</code> or <code>role: "moderator"</code>.</p>
            </div>

            {/* Suggestions Moderation */}
            <div className="endpoint-group">
                <h3><Shield size={20} /> Mosque Suggestions</h3>
            </div>

            <div className="section">
                <h2>List Suggestions</h2>
                <div className="endpoint-badge get">GET /moderation/suggestions</div>
                <p>Retrieve all suggestions awaiting review. Filter by status to see approved/rejected items.</p>

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
                        <tr><td><code>status</code></td><td>string</td><td>Filter by status: <code>pending_approval</code> (default), <code>approved</code>, <code>rejected</code>, or <code>all</code></td></tr>
                    </tbody>
                </table>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`GET https://mosquestn-api.azurewebsites.net/moderation/suggestions?status=pending_approval
Authorization: Bearer <admin_token>`} />

                <h4>Example Response</h4>
                <CodeBlock code={`[
  {
    "id": 45,
    "arabic_name": "Masjid Al-Nour",
    "status": "pending_approval",
    "confirmations_count": 2,
    "created_at": "2023-10-15T14:30:00Z"
  }
]`} />
            </div>

            <div className="section">
                <h2>Approve Suggestion</h2>
                <div className="endpoint-badge post">POST /moderation/suggestions/:id/approve</div>
                <p>Approve a mosque suggestion and create it as an official mosque entry.</p>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`POST https://mosquestn-api.azurewebsites.net/moderation/suggestions/45/approve
Authorization: Bearer <admin_token>`} />

                <h4>Example Response</h4>
                <CodeBlock code={`{
  "id": 45,
  "status": "approved",
  "message": "Suggestion approved and mosque created"
}`} />
            </div>

            <div className="section">
                <h2>Reject Suggestion</h2>
                <div className="endpoint-badge post">POST /moderation/suggestions/:id/reject</div>
                <p>Reject a mosque suggestion.</p>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`POST https://mosquestn-api.azurewebsites.net/moderation/suggestions/45/reject
Authorization: Bearer <admin_token>`} />
            </div>

            <div className="section">
                <h2>Delete Suggestion <span className="role-badge admin">Admin Only</span></h2>
                <div className="endpoint-badge delete">DELETE /moderation/suggestions/:id</div>
                <p>Permanently delete a suggestion. Only administrators can perform this action.</p>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`DELETE https://mosquestn-api.azurewebsites.net/moderation/suggestions/45
Authorization: Bearer <admin_token>`} />
            </div>

            {/* Reviews Moderation */}
            <div className="endpoint-group">
                <h3><Shield size={20} /> Reviews</h3>
            </div>

            <div className="section">
                <h2>List Reviews</h2>
                <div className="endpoint-badge get">GET /moderation/reviews</div>
                <p>Retrieve reviews awaiting moderation.</p>

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
                        <tr><td><code>status</code></td><td>string</td><td>Filter: <code>pending</code>, <code>approved</code>, <code>rejected</code>, <code>all</code></td></tr>
                        <tr><td><code>mosque_id</code></td><td>integer</td><td>Filter by specific mosque</td></tr>
                    </tbody>
                </table>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`GET https://mosquestn-api.azurewebsites.net/moderation/reviews?status=pending
Authorization: Bearer <moderator_token>`} />
            </div>

            <div className="section">
                <h2>Approve Review</h2>
                <div className="endpoint-badge post">POST /moderation/reviews/:id/approve</div>
                <p>Approve a review to make it publicly visible.</p>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`POST https://mosquestn-api.azurewebsites.net/moderation/reviews/101/approve
Authorization: Bearer <moderator_token>`} />
            </div>

            <div className="section">
                <h2>Reject Review</h2>
                <div className="endpoint-badge post">POST /moderation/reviews/:id/reject</div>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`POST https://mosquestn-api.azurewebsites.net/moderation/reviews/101/reject
Authorization: Bearer <moderator_token>`} />
            </div>

            {/* Edits Moderation */}
            <div className="endpoint-group">
                <h3><Shield size={20} /> Edit Suggestions</h3>
            </div>

            <div className="section">
                <h2>List Edit Suggestions</h2>
                <div className="endpoint-badge get">GET /moderation/edits</div>
                <p>Retrieve edit suggestions awaiting review.</p>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`GET https://mosquestn-api.azurewebsites.net/moderation/edits?status=pending
Authorization: Bearer <moderator_token>`} />
            </div>

            <div className="section">
                <h2>Approve Edit</h2>
                <div className="endpoint-badge post">POST /moderation/edits/:id/approve</div>
                <p>Approve an edit suggestion and apply the changes to the mosque.</p>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`POST https://mosquestn-api.azurewebsites.net/moderation/edits/23/approve
Authorization: Bearer <moderator_token>`} />
            </div>

            <div className="section">
                <h2>Reject Edit</h2>
                <div className="endpoint-badge post">POST /moderation/edits/:id/reject</div>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code={`POST https://mosquestn-api.azurewebsites.net/moderation/edits/23/reject
Authorization: Bearer <moderator_token>`} />
            </div>
        </div>
    );
};

export default Moderation;
