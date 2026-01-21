import React from 'react';
import CodeBlock from '../components/CodeBlock';

const Reviews = () => {
    return (
        <div>
            <h1>Reviews Endpoints</h1>
            <p>
                Reviews allow users to rate mosques and provide feedback.
                Reviews are linked to specific mosques and are subject to moderation.
            </p>

            {/* Create Review */}
            <div className="section">
                <h2>Create Review</h2>
                <div className="endpoint-badge post">POST /mosques/:id/reviews</div>
                <p><strong>Optional Authentication.</strong> Submit a review for a mosque. If the user is authenticated, the review will be linked to their account.</p>

                <h4>Example Request</h4>
                <div className="alert-box" style={{ marginBottom: '1rem' }}>
                    <strong>Note:</strong> Replace <code>:id</code> with the actual ID of the mosque (e.g., <code>1</code>).
                </div>

                <CodeBlock language="bash" code={`POST https://mosquestn-api.azurewebsites.net/mosques/1/reviews
Content-Type: application/json`} />

                <h4>Payload</h4>
                <CodeBlock code={`{
  "rating": 5,
  "comment": "Mashallah, very peaceful and clean. The Imam has a beautiful voice.",
  "criteria": {
    "cleanliness": 5,
    "maintenance": 4,
    "atmosphere": 5
  }
}`} />
                <p><code>rating</code> (1-5) is required. Criteria are optional key-value pairs (1-5).</p>

                <h4>Example Response</h4>
                <CodeBlock code={`{
  "id": 101,
  "mosque_id": 1,
  "status": "pending_approval",
  "message": "Review submitted successfully"
}`} />
            </div>

            {/* List Reviews */}
            <div className="section">
                <h2>List Reviews</h2>
                <div className="endpoint-badge get">GET /mosques/:id/reviews</div>
                <p>Retrieve approved reviews for a specific mosque.</p>

                <h4>Example Request</h4>
                <CodeBlock language="bash" code="GET https://mosquestn-api.azurewebsites.net/mosques/1/reviews" />

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
                        <tr><td><code>limit</code></td><td>integer</td><td>Max reviews to return (default: 20)</td></tr>
                        <tr><td><code>offset</code></td><td>integer</td><td>Pagination offset</td></tr>
                    </tbody>
                </table>

                <h4>Example Response</h4>
                <CodeBlock code={`[
  {
    "id": 101,
    "rating": 5,
    "comment": "Very peaceful and clean.",
    "criteria": {
        "cleanliness": 5,
        "maintenance": 4,
        "atmosphere": 5
    },
    "created_at": "2023-01-15T08:30:00Z",
    "user": {
        "username": "Ahmed"
    }
  }
]`} />
            </div>
        </div>
    );
};

export default Reviews;
