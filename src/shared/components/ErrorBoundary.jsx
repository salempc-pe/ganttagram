import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
                    <h1 style={{ color: '#ef4444' }}>Algo salió mal 😔</h1>
                    <p>Se ha producido un error en la aplicación.</p>
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: '#f3f4f6',
                        borderRadius: '0.5rem',
                        textAlign: 'left',
                        overflow: 'auto',
                        maxHeight: '300px'
                    }}>
                        <p style={{ fontWeight: 'bold', color: '#dc2626' }}>{this.state.error && this.state.error.toString()}</p>
                        <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1.5rem',
                            padding: '0.5rem 1rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                        }}
                    >
                        Recargar página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
