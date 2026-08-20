import styled from 'styled-components';

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Logo = styled.img`
  width: 42px;
  height: 42px;
  object-fit: contain;
`;

const BrandText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.title};
  line-height: 1.1;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.small};
`;

export function BrandHeader() {
  return (
    <Header>
      <Logo src="/icons/icon-128.png" alt="" />
      <BrandText>
        <Title>FlowSnap</Title>
        <Subtitle>Gravador de fluxos</Subtitle>
      </BrandText>
    </Header>
  );
}
