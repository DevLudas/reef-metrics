# User Journey - Login & Registration Module

## Overview
This diagram visualizes the complete user journey for authentication and registration in ReefMetrics, including login, registration, password recovery, and first-time user onboarding flows.

## Diagram

```mermaid
%%{init: {'stateDiagram': {'fontSize': 16}, 'primaryTextColor':'#000', 'primaryBorderColor':'#333', 'lineColor':'#666', 'secondBkgColor':'#e6f2ff', 'tertiaryBkgColor':'#fff8e6'}}%%
stateDiagram-v2
    [*] --> HomePage

    state "Home Page" as HomePage {
        [*] --> AuthMenu
        AuthMenu: Choose between Sign In or Sign Up
    }

    HomePage --> LoginDecision: User Action
    
    state if_auth_choice <<choice>>
    AuthMenu --> if_auth_choice
    if_auth_choice --> LoginFlow: Sign In
    if_auth_choice --> RegistrationFlow: Sign Up
    
    state "Login Flow" as LoginFlow {
        [*] --> LoginForm
        LoginForm: Enter email and password
        
        LoginForm --> ValidateCredentials
        ValidateCredentials: Check credentials against database
        
        ValidateCredentials --> if_login_valid <<choice>>
        if_login_valid --> LoginError: Credentials Invalid
        if_login_valid --> LoginSuccess: Credentials Valid
        
        LoginError: Display error message
        LoginError --> LoginForm: Retry
        
        LoginSuccess: Session created
    }
    
    LoginSuccess --> Dashboard
    
    state "Registration Flow" as RegistrationFlow {
        [*] --> RegForm
        RegForm: Enter name, email, password
        
        RegForm --> ValidateRegData
        ValidateRegData: Validate email format and password match
        
        ValidateRegData --> if_reg_valid <<choice>>
        if_reg_valid --> RegError: Validation Failed
        if_reg_valid --> CreateAccount: Validation Passed
        
        RegError: Display validation errors
        RegError --> RegForm: Retry
        
        CreateAccount: Database transaction
        
        state "Account Creation Process" as AccountCreation {
            [*] --> fork_creation <<fork>>
            fork_creation --> CreateUser
            fork_creation --> SendEmail
            CreateUser: Create user record
            SendEmail: Send welcome email
            CreateUser --> join_creation <<join>>
            SendEmail --> join_creation
            join_creation --> [*]
        }
        
        CreateAccount --> AccountCreation
        AccountCreation --> AutoLogin
        AutoLogin: Automatically log in user
    }
    
    AutoLogin --> FirstAquariumSetup
    
    state "First Aquarium Setup" as FirstAquariumSetup {
        [*] --> OnboardingChoice
        OnboardingChoice: New user onboarding
        
        OnboardingChoice --> if_setup_choice <<choice>>
        if_setup_choice --> SkipSetup: Skip
        if_setup_choice --> AquariumForm: Add Aquarium
        
        AquariumForm: Enter aquarium name, type, description
        AquariumForm --> SaveAquarium
        SaveAquarium: Save to database
    }
    
    SkipSetup --> Dashboard
    SaveAquarium --> Dashboard
    
    state "Authenticated Dashboard" as Dashboard {
        [*] --> MainDashboard
        MainDashboard: View aquarium metrics and measurements
        
        MainDashboard --> UserMenu
        UserMenu: Access user menu and actions
        
        UserMenu --> if_user_action <<choice>>
        if_user_action --> ManageAquariums: Aquarium Management
        if_user_action --> ProfileSettings: Profile Settings
        if_user_action --> DoLogout: Logout
        
        ManageAquariums: Add, edit, delete aquariums
        ProfileSettings: View/edit profile information
    }
    
    Dashboard --> DoLogout
    
    state "Logout Process" as LogoutProcess {
        [*] --> TerminateSession
        TerminateSession: Clear session and cookies
    }
    
    DoLogout --> LogoutProcess
    LogoutProcess --> HomePage
    
    state "Password Recovery" as PasswordRecovery {
        [*] --> ForgotPasswordLink
        ForgotPasswordLink: Click Forgot Password on Login
        
        ForgotPasswordLink --> EmailEntry
        EmailEntry: Enter email address
        
        EmailEntry --> CheckEmail
        CheckEmail: Verify email exists in database
        
        CheckEmail --> if_email_exists <<choice>>
        if_email_exists --> SendReset: Email Exists
        if_email_exists --> EmailNotFound: Email Not Found
        
        EmailNotFound: Display message
        EmailNotFound --> EmailEntry: Retry
        
        SendReset: Send password reset link
        SendReset --> ResetLinkSent
        ResetLinkSent: Confirmation message
    }
    
    LoginForm --> ForgotPasswordLink: Click Forgot Password
    
    state "Reset Password Completion" as ResetCompletion {
        [*] --> VerifyToken
        VerifyToken: Validate reset token from email link
        
        VerifyToken --> if_token_valid <<choice>>
        if_token_valid --> TokenExpired: Token Invalid/Expired
        if_token_valid --> ResetForm: Token Valid
        
        TokenExpired: Display expiration message
        TokenExpired --> RequestNewLink
        RequestNewLink: Option to request new link
        RequestNewLink --> ForgotPasswordLink
        
        ResetForm: Enter new password
        ResetForm --> ValidateNewPassword
        ValidateNewPassword: Validate password strength
        
        ValidateNewPassword --> if_password_valid <<choice>>
        if_password_valid --> PasswordError: Validation Failed
        if_password_valid --> UpdatePassword: Validation Passed
        
        PasswordError: Display error
        PasswordError --> ResetForm
        
        UpdatePassword: Save new password to database
        UpdatePassword --> PasswordSuccess
        PasswordSuccess: Success message
    }
    
    ResetLinkSent --> ResetCompletion
    PasswordSuccess --> LoginForm
    
    note right of HomePage
        Entry point for all users
        Unauthenticated state
    end note
    
    note right of LoginForm
        User enters existing credentials
        Email format and password required
    end note
    
    note right of RegForm
        New user registration
        Name, email, password confirmation needed
        Email must be unique
    end note
    
    note right of FirstAquariumSetup
        Guided onboarding for new users
        Users can skip and add later
        Sets initial aquarium context
    end note
    
    note right of Dashboard
        Main authenticated area
        User can manage profile
        Access all features
    end note
    
    note right of PasswordRecovery
        Self-service password recovery
        Email-based verification
        Secure token validation
    end note
```

## Journey Description

### 1. **Unauthenticated User Journey**
- User lands on Home Page
- Presented with Login or Registration options
- No access to application features until authenticated

### 2. **New User Registration Journey**
- User clicks "Sign Up"
- Fills registration form (name, email, password)
- System validates email format and password matching
- On validation failure: error message displayed, user can retry
- On validation success: account created in database
- Welcome email sent (parallel to account creation)
- User automatically logged in
- Redirected to First Aquarium Setup
- User can add first aquarium or skip to dashboard

### 3. **Existing User Login Journey**
- User clicks "Sign In"
- Enters email and password
- System validates credentials against database
- On invalid credentials: error message, user can retry
- On valid credentials: session created, user redirected to dashboard

### 4. **Password Recovery Journey**
- User clicks "Forgot Password?" on login form
- Enters email address
- System verifies email exists in database
- If email found: password reset link sent via email
- User receives email with secure reset token
- User clicks reset link and is directed to reset form
- System validates reset token (checks validity and expiration)
- If token invalid/expired: user can request new link
- If token valid: user enters new password
- New password validated for strength requirements
- Password updated in database
- User can now login with new password

### 5. **Authenticated User Journey**
- User accesses dashboard after successful login
- Can view aquarium metrics
- Can manage aquariums (add, edit, delete)
- Can access profile settings
- Can initiate logout
- Logout terminates session and redirects to home page

## Key Decision Points

1. **Initial Authentication Decision**: Sign In vs. Sign Up
2. **Registration Validation**: Valid data vs. validation errors
3. **Login Validation**: Correct credentials vs. invalid credentials
4. **First-time Setup**: Add aquarium vs. skip to dashboard
5. **Password Recovery**: Email exists vs. email not found
6. **Token Validation**: Valid token vs. expired/invalid token
7. **Password Validation**: Strong password vs. weak password

