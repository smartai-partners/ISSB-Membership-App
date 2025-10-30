import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardGrid,
  DefaultCardGrid,
  CompactCardGrid,
  FeatureCardGrid,
  CardLoading,
  CardSpinner,
  CardSkeleton,
  InlineLoading
} from './index';

/**
 * Card Component Examples
 * 
 * This file demonstrates all the Card components and their variations.
 * Use this as a reference for implementing cards in your application.
 */

export const CardExamples: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // Sample data for demonstration
  const sampleCardData = {
    title: "Sample Card Title",
    description: "This is a sample card description that demonstrates how content looks in the card component.",
    actions: [
      { label: "Action 1", variant: "primary" as const, onClick: () => console.log("Action 1") },
      { label: "Action 2", variant: "secondary" as const, onClick: () => console.log("Action 2") }
    ]
  };

  return (
    <div className="space-y-8 p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8">Card Component Examples</h1>

        {/* Basic Card Examples */}
        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Basic Card Variants</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="default">
              <CardHeader title="Default Card" />
              <CardContent>
                <p>Default card with standard shadow and border.</p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader title="Elevated Card" />
              <CardContent>
                <p>Card with elevated shadow for emphasis.</p>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardHeader title="Outlined Card" />
              <CardContent>
                <p>Card with thicker border for prominent display.</p>
              </CardContent>
            </Card>

            <Card variant="ghost">
              <CardHeader title="Ghost Card" />
              <CardContent>
                <p>Minimal card with subtle styling.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Interactive Cards */}
        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Interactive Cards</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card hover interactive>
              <CardHeader title="Hover Effect" subtitle="This card has hover effects" />
              <CardContent>
                <p>Hover over this card to see the elevated shadow and subtle lift effect.</p>
              </CardContent>
              <CardFooter>
                <button className="btn-primary">Learn More</button>
              </CardFooter>
            </Card>

            <Card interactive onClick={() => console.log("Card clicked!")}>
              <CardHeader title="Clickable Card" subtitle="Click anywhere on this card" />
              <CardContent>
                <p>This entire card is clickable and will trigger the onClick handler.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Padding Variations */}
        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Padding Variations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="none">
              <CardHeader title="No Padding" border={false} />
              <CardContent padding="none">
                <p className="text-sm">Card with no padding - content touches the edges.</p>
              </CardContent>
            </Card>

            <Card padding="sm">
              <CardHeader title="Small Padding" />
              <CardContent>
                <p className="text-sm">Card with small padding for compact layouts.</p>
              </CardContent>
            </Card>

            <Card padding="md">
              <CardHeader title="Medium Padding" />
              <CardContent>
                <p>Card with medium padding - the default option.</p>
              </CardContent>
            </Card>

            <Card padding="lg">
              <CardHeader title="Large Padding" />
              <CardContent>
                <p>Card with large padding for spacious, airy layouts.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Card Header Examples */}
        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Card Header Variations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Basic Header" subtitle="This is a subtitle" />
              <CardContent>
                <p>Simple header with title and subtitle.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Header with Actions" subtitle="Subtitle text here">
                <div className="flex space-x-2">
                  <button className="btn-secondary btn-sm">Edit</button>
                  <button className="btn-secondary btn-sm">Share</button>
                </div>
              </CardHeader>
              <CardContent>
                <p>Header with custom content and action buttons.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Card Footer Examples */}
        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Card Footer Variations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent>
                <p>Left-aligned footer content.</p>
              </CardContent>
              <CardFooter align="left">
                <button className="btn-primary">Primary Action</button>
              </CardFooter>
            </Card>

            <Card>
              <CardContent>
                <p>Center-aligned footer content.</p>
              </CardContent>
              <CardFooter align="center">
                <button className="btn-primary">Center Action</button>
              </CardFooter>
            </Card>

            <Card>
              <CardContent>
                <p>Space-between aligned footer with multiple actions.</p>
              </CardContent>
              <CardFooter align="between">
                <button className="btn-secondary">Cancel</button>
                <button className="btn-primary">Confirm</button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Card Grid Examples */}
        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Card Grid Layouts</h2>
          
          <DefaultCardGrid>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} hover interactive>
                <CardHeader title={`Card ${i}`} subtitle={`Item ${i} of 6`} />
                <CardContent>
                  <p>This is card number {i} in the default grid layout. The grid automatically adjusts columns based on screen size.</p>
                </CardContent>
                <CardFooter>
                  <button className="btn-primary btn-sm">Action</button>
                </CardFooter>
              </Card>
            ))}
          </DefaultCardGrid>
        </section>

        {/* Feature Grid */}
        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Feature Card Grid</h2>
          
          <FeatureCardGrid gap="lg">
            {[
              { title: "Feature 1", description: "First feature description" },
              { title: "Feature 2", description: "Second feature description" },
              { title: "Feature 3", description: "Third feature description" }
            ].map((feature, i) => (
              <Card key={i} variant="elevated" hover>
                <CardHeader title={feature.title} />
                <CardContent>
                  <p>{feature.description}</p>
                </CardContent>
                <CardFooter align="right">
                  <button className="btn-primary">Learn More</button>
                </CardFooter>
              </Card>
            ))}
          </FeatureCardGrid>
        </section>

        {/* Compact Grid */}
        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Compact Card Grid</h2>
          
          <CompactCardGrid gap="sm">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <Card key={i} padding="sm">
                <CardContent padding="none">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-sm">{i}</span>
                    </div>
                    <p className="text-xs font-medium">Card {i}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CompactCardGrid>
        </section>

        {/* Loading States */}
        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Loading States</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardLoading variant="skeleton">
              <p className="sr-only">Loading skeleton content...</p>
            </CardLoading>

            <CardLoading variant="spinner" text="Loading content..." />
            
            <CardLoading variant="dots" text="Please wait..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card hover interactive>
              <CardHeader title="Card with Inline Loading" />
              <CardContent>
                <p>This card shows inline loading state:</p>
                <InlineLoading size="sm" />
              </CardContent>
            </Card>

            <div className="relative">
              <Card hover interactive>
                <CardHeader title="Card with Overlay Loading" />
                <CardContent>
                  <p>This card shows overlay loading state. The loading overlay appears on top of the content.</p>
                </CardContent>
              </Card>
              <CardLoading 
                variant="spinner" 
                text="Processing..." 
                overlay 
                className="rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* Complex Card Example */}
        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Complex Card Example</h2>
          
          <Card variant="elevated" hover className="max-w-md">
            <CardHeader 
              title="User Profile Card"
              subtitle="Software Engineer"
            >
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-primary-500 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium">
                  JD
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Experience</span>
                  <span className="text-sm font-medium">5 years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Location</span>
                  <span className="text-sm font-medium">San Francisco, CA</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Availability</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Available
                  </span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter align="between">
              <button className="btn-secondary">Message</button>
              <button className="btn-primary">Hire</button>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default CardExamples;