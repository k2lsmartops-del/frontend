import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormCard from './FormCard'

const MockIcon = () => <div data-testid="mock-icon" />

describe('FormCard', () => {
  it('should render title and icon', () => {
    render(
      <FormCard title="Test Card" icon={MockIcon as any}>
        <div>Card Content</div>
      </FormCard>
    )

    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('Card Content')).toBeInTheDocument()
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
  })

  it('should render children', () => {
    render(
      <FormCard title="Test Card" icon={MockIcon as any}>
        <p>First child</p>
        <p>Second child</p>
      </FormCard>
    )

    expect(screen.getByText('First child')).toBeInTheDocument()
    expect(screen.getByText('Second child')).toBeInTheDocument()
  })

  it('should have correct CSS classes', () => {
    const { container } = render(
      <FormCard title="Test Card" icon={MockIcon as any}>
        <div>Content</div>
      </FormCard>
    )

    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('rounded-lg')
    expect(card.className).toContain('bg-white')
    expect(card.className).toContain('shadow')
  })
})
