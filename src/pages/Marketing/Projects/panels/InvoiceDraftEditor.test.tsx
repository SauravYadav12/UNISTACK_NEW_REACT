import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import InvoiceDraftEditor, {
  DraftEditorState,
} from './InvoiceDraftEditor';

function Harness({ initial }: { initial: DraftEditorState }) {
  const [v, setV] = useState(initial);
  return (
    <>
      <InvoiceDraftEditor value={v} currency="USD" onChange={setV} />
      <div data-testid="subtotal">
        {v.lineItems.reduce((acc, li) => acc + li.amount, 0)}
      </div>
    </>
  );
}

describe('InvoiceDraftEditor', () => {
  it('derives line amount from hours × rate', () => {
    render(
      <Harness
        initial={{
          lineItems: [{ description: 'Week 1', amount: 0 }],
          taxPercent: 0,
        }}
      />
    );
    // Two tax-percent inputs + hours/rate/amount per line
    // We find the first spinbutton for hours
    const numberInputs = screen.getAllByRole('spinbutton');
    // Inputs order: hours, rate, amount, taxPercent. Fire 40 h and 50 rate.
    fireEvent.change(numberInputs[0], { target: { value: '40' } });
    fireEvent.change(numberInputs[1], { target: { value: '50' } });
    // Amount field should reflect hours × rate = 2000
    expect((numberInputs[2] as HTMLInputElement).value).toBe('2000');
  });

  it('recomputes tax when taxPercent changes', () => {
    render(
      <Harness
        initial={{
          lineItems: [{ description: 'w', amount: 1000 }],
          taxPercent: 0,
        }}
      />
    );
    // Find the tax percent input — it's the last spinbutton (hours/rate/amount + tax)
    const numberInputs = screen.getAllByRole('spinbutton');
    const taxInput = numberInputs[numberInputs.length - 1];
    fireEvent.change(taxInput, { target: { value: '10' } });
    // Both tax ($100) and total ($1,100) show "100", so match on the tax
    // label neighbourhood — grab all matches and assert the tax cell + total.
    const hits = screen.getAllByText(/100/);
    // Expect at least three: the subtotal $1,000 neighbourhood, tax $100.00,
    // and total $1,100.00 — we're simply verifying the math propagated.
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$1,100.00')).toBeInTheDocument();
  });
});
