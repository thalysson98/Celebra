// Cartão reutilizável. Recebe dados por props (title, buttonLabel, onPress)
// e o conteúdo principal pelo children, como na aula.
import { StyleSheet } from 'react-native';
import { Card, Button } from 'react-native-paper';

export default function CartaoPadrao({
  title = 'Sem título',   // valor padrão, caso não seja passado
  children,               // conteúdo colocado entre <CartaoPadrao> ... </CartaoPadrao>
  buttonLabel,            // texto do botão (opcional)
  onPress,
  ...props                // qualquer outro atributo (ex.: style) é repassado ao Card
}) {
  return (
    <Card style={styles.card} {...props}>
      <Card.Title title={title} />

      <Card.Content>{children}</Card.Content>

      {/* O botão só aparece se buttonLabel tiver valor */}
      {!!buttonLabel && (
        <Card.Actions>
          <Button mode="contained" onPress={onPress}>
            {buttonLabel}
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
});