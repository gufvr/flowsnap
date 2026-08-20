import styled from 'styled-components';

interface ClosePanelButtonProps {
  onClick: () => void | Promise<void>;
}

const Button = styled.button`
  display: grid;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  margin-left: auto;
  padding: 0;
  place-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  font: inherit;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition:
    color 120ms ease,
    background 120ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.border};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export function ClosePanelButton({ onClick }: ClosePanelButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-label="Fechar painel"
      title="Fechar painel"
    >
      ×
    </Button>
  );
}
