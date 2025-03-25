/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from '../src/Card';

describe('Card Component', () => {
    it('renders children correctly', () => {
        render(
            <Card>
                <div>Test Content</div>
            </Card>
        );

        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(
            <Card className="custom-class">
                <div>Test Content</div>
            </Card>
        );

        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom styles', () => {
        const { container } = render(
            <Card style={{ backgroundColor: 'red' }}>
                <div>Test Content</div>
            </Card>
        );

        expect(container.firstChild).toHaveStyle({ backgroundColor: 'red' });
    });
}); 