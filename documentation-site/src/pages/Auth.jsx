import React from 'react';
import CodeBlock from '../components/CodeBlock';

const Auth = () => {
    return (
        <div>
            <h1>Authentication</h1>
            <p>
                The API uses JWT (JSON Web Tokens) for authentication.
                Most public read endpoints do not require authentication, but creating suggestions and
                accessing moderation features does.
            </p>

            <h2>Obtaining a Token</h2>
            <p>There are two ways to authenticate: as a <strong>Guest User</strong> (mobile app) or as an <strong>Admin/Moderator</strong>.</p>

            <h3>1. Public/Mobile App Access</h3>
            <p>
                For public uses (like the mobile app), you can request a long-lived guest token.
                This is used to track submissions anonymously without requiring user registration.
            </p>

            <div className="endpoint-badge post">POST /auth/login</div>
            <p><strong>Payload:</strong></p>
            <CodeBlock code={`{
  "role": "user"
}`} />

            <p><strong>Response:</strong></p>
            <CodeBlock code={`{
  "access_token": "eyJ0eXAi...",
  "role": "guest",
  "user_id": 123
}`} />

            <h3>2. Admin Access</h3>
            <p>For administrative access, provide your credentials.</p>

            <CodeBlock code={`{
  "username": "admin",
  "password": "your_password"
}`} />

            <h2>Using the Token</h2>
            <p>Include the token in the <code>Authorization</code> header of your requests:</p>
            <CodeBlock language="text" code={`Authorization: Bearer <your_token>`} />

            <h2>Verify Token</h2>
            <p>You can check the validity of your current token.</p>
            <div className="endpoint-badge get">GET /auth/me</div>
        </div>
    );
};

export default Auth;
