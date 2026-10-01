import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { Card } from "react-native-paper";

export default function Movies() {
    const [data, setData] = useState([]);
    const [isLoading, setLoading] = useState(true);

    const getMovies = async () => {
        try {
            const response = await fetch('https://www.omdbapi.com/?s=spider%20man&apikey=1cd66749');
            const json = await response.json();
            setData(json.Search || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getMovies();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Lista de filmes</Text>

            {isLoading ? (
                <ActivityIndicator size="large" color="#6200ee" style={styles.loading} />
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={item => item.imdbID}
                    renderItem={({ item }) => (
                        <Card style={styles.card}>
                            {item.Poster && item.Poster !== "N/A" && (
                                <Card.Cover source={{ uri: item.Poster }} />
                            )}
                            <Card.Title title={item.Title} subtitle={`Ano: ${item.Year}`} />
                            <Card.Content>
                                <Text>Tipo: {item.Type}</Text>
                            </Card.Content>
                        </Card>
                    )}
                    style={styles.list}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginVertical: 10,
    },
    loading: {
        marginTop: 30,
    },
    list: {
        width: "100%",
    },
    card: {
        marginBottom: 15,
    },
});