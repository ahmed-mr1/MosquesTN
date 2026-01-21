import React from 'react';
import CodeBlock from '../components/CodeBlock';
import { MapPin, MessageSquare, Shield, BookOpen } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="feature-card">
        <div className="feature-icon">
            <Icon size={24} color="var(--color-primary)" />
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
    </div>
);

const Home = () => {
    return (
        <>
            <div className="islamic-pattern"></div>
            <div className="home-container">
                {/* Hero Section */}
                <div className="hero-section">
                    <h1>Tunisian Mosques API</h1>
                    <p className="hero-lead">
                        Building a comprehensive, community-driven digital directory for mosques in Tunisia.
                    </p>
                    <div className="hero-badges">
                        <span className="badge badge-success">v1.0.0 Stable</span>
                        <span className="badge badge-primary">Open Data</span>
                    </div>
                </div>

                {/* Quick Stats / Info Widget */}
                <div className="info-widget">
                    <div className="widget-item">
                        <div className="widget-label">Base URL</div>
                        <code className="widget-value">https://mosquestn-api.azurewebsites.net</code>
                    </div>
                    <div className="widget-actions">
                        {/* Placeholder for future actions like 'Check Status' */}
                        <span className="status-dot online"></span> API Online
                    </div>
                </div>

                {/* Features Grid */}
                <div className="features-grid">
                    <FeatureCard
                        icon={MapPin}
                        title="Geospatial Search"
                        description="Find mosques near any location with precise radius-based queries."
                    />
                    <FeatureCard
                        icon={MessageSquare}
                        title="Community Driven"
                        description="Users can suggest new mosques and provide real-time updates."
                    />
                    <FeatureCard
                        icon={Shield}
                        title="AI Moderation"
                        description="Advanced content moderation ensures data quality and safety."
                    />
                    <FeatureCard
                        icon={BookOpen}
                        title="Detailed Metadata"
                        description="Access prayer times, facilities, and staff information."
                    />
                </div>

                <div className="content-section">
                    <h2>How to Use This API</h2>
                    <p>
                        The API is built around REST principles. All requests should be made to the Base URL
                        followed by the specific resource path.
                    </p>

                    <h3>Step 1: Choose Your Client</h3>
                    <p>
                        You can consume this API using any HTTP client. Typical examples include:
                    </p>
                    <ul className="client-list">
                        <li><strong>JavaScript:</strong> <code>fetch</code> or <code>axios</code></li>
                        <li><strong>Python:</strong> <code>requests</code> or <code>httpx</code></li>
                        <li><strong>Mobile:</strong> <code>Retrofit</code> or <code>fetch</code></li>
                    </ul>

                    <h3>Step 2: Construct the URL</h3>
                    <p>
                        Combine the <span className="highlight">Base URL</span> with the <span className="highlight">Endpoint Path</span>.
                        For example, to list all mosques:
                    </p>
                    <div className="url-builder">
                        <span className="base">https://mosquestn-api.azurewebsites.net</span>
                        <span className="path">/mosques</span>
                    </div>

                    <h3>Step 3: Make the Request</h3>

                    <h4>JavaScript Example (Fetch)</h4>
                    <CodeBlock language="javascript" code={`fetch('https://mosquestn-api.azurewebsites.net/mosques?city=Tunis')
  .then(response => response.json())
  .then(data => console.log(data));`} />

                    <h4>cURL Example</h4>
                    <CodeBlock language="bash" code={`curl -X GET "https://mosquestn-api.azurewebsites.net/mosques?city=Tunis"`} />
                </div>

                <div className="credit-footer">
                    <p>Developed by <strong>Ahmed Mrabet</strong></p>
                </div>
            </div>
        </>
    );
};

export default Home;
