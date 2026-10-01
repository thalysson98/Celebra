import { Button, Card, Text } from 'react-native-paper';
import { StyleSheet } from 'react-native';

export default function CardComponent({img, title, text, button = "Sim", ...props}) {
    return (
        <Card>
            <Card.Cover source={{uri: img}}/>
            <Card.Title title={title}/>
            <Card.Content>
               <Text variant="titleLarge">{text}</Text>
            </Card.Content>
            <Card.Actions style={{justifyContent: 'center'}}>
                <Button>{button}</Button>
            </Card.Actions>
        </Card>
    )
}