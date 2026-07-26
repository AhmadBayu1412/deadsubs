// Phase 5 — Layout: Main
// Main content area — wraps the router outlet with responsive padding and Container.
import { useOutlet } from 'react-router-dom';
import { Container } from '../ui/Container';

export function Main() {
  const outlet = useOutlet();

  return (
    <main className="flex-1 overflow-auto">
      <Container size="lg" className="py-6 lg:py-8">
        {outlet}
      </Container>
    </main>
  );
}
