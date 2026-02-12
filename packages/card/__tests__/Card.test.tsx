/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card, CardHeader, CardContent, CardFooter, CardImage } from '../src/Card';

describe('Card Component', () => {
    describe('基本功能', () => {
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

    describe('變體和主題', () => {
        it('renders with outlined variant', () => {
            const { container } = render(
                <Card variant="outlined">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });

        it('renders with filled variant', () => {
            const { container } = render(
                <Card variant="filled">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });

        it('renders with elevated variant', () => {
            const { container } = render(
                <Card variant="elevated">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });

        it('renders with glass variant', () => {
            const { container } = render(
                <Card variant="glass">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });

        it('renders with gradient variant', () => {
            const { container } = render(
                <Card variant="gradient">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });

        it('applies violet theme', () => {
            const { container } = render(
                <Card theme="violet">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });

        it('applies cyan theme', () => {
            const { container } = render(
                <Card theme="cyan">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });
    });

    describe('尺寸', () => {
        it('renders with small size', () => {
            const { container } = render(
                <Card size="sm">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });

        it('renders with medium size', () => {
            const { container } = render(
                <Card size="md">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });

        it('renders with large size', () => {
            const { container } = render(
                <Card size="lg">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });

        it('renders with extra large size', () => {
            const { container } = render(
                <Card size="xl">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });
    });

    describe('載入狀態', () => {
        it('shows skeleton loading state', () => {
            render(
                <Card loading loadingMode="skeleton">
                    <div>Test Content</div>
                </Card>
            );

            // 載入狀態下內容應該不可見
            expect(screen.queryByText('Test Content')).toBeInTheDocument();
        });

        it('shows shimmer loading state', () => {
            render(
                <Card loading loadingMode="shimmer">
                    <div>Test Content</div>
                </Card>
            );

            expect(screen.queryByText('Test Content')).toBeInTheDocument();
        });

        it('shows overlay loading state', () => {
            render(
                <Card loading loadingMode="overlay">
                    <div>Test Content</div>
                </Card>
            );

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });
    });

    describe('互動性', () => {
        it('handles onClick event when clickable', () => {
            const handleClick = jest.fn();
            const { container } = render(
                <Card clickable onClick={handleClick}>
                    <div>Test Content</div>
                </Card>
            );

            const card = container.firstChild as HTMLElement;
            fireEvent.click(card);

            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('applies cursor-pointer class when clickable', () => {
            const { container } = render(
                <Card clickable>
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toHaveClass('cursor-pointer');
        });
    });

    describe('子元件', () => {
        it('renders CardHeader', () => {
            render(
                <Card>
                    <CardHeader>
                        <h3>Header Content</h3>
                    </CardHeader>
                </Card>
            );

            expect(screen.getByText('Header Content')).toBeInTheDocument();
        });

        it('renders CardContent', () => {
            render(
                <Card>
                    <CardContent>
                        <p>Content Text</p>
                    </CardContent>
                </Card>
            );

            expect(screen.getByText('Content Text')).toBeInTheDocument();
        });

        it('renders CardFooter', () => {
            render(
                <Card>
                    <CardFooter>
                        <button>Footer Button</button>
                    </CardFooter>
                </Card>
            );

            expect(screen.getByText('Footer Button')).toBeInTheDocument();
        });

        it('renders CardImage', () => {
            render(
                <Card>
                    <CardImage src="test.jpg" alt="Test Image" />
                </Card>
            );

            const img = screen.getByAltText('Test Image');
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute('src', 'test.jpg');
        });
    });

    describe('深色模式', () => {
        it('renders in light mode', () => {
            const { container } = render(
                <Card mode="light">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });

        it('renders in dark mode', () => {
            const { container } = render(
                <Card mode="dark">
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });
    });

    describe('視覺效果', () => {
        it('renders with shadow', () => {
            const { container } = render(
                <Card shadow>
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });

        it('renders with glow effect', () => {
            const { container } = render(
                <Card glow>
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });

        it('renders without border when bordered is false', () => {
            const { container } = render(
                <Card bordered={false}>
                    <div>Test Content</div>
                </Card>
            );

            expect(container.firstChild).toBeInTheDocument();
        });
    });
}); 