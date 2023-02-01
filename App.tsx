import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button, Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { useState, useEffect } from 'react';

interface INames {
  id: number;
  name: string;
}

// expo add expo-sqlite
// expo add expo-file-system
// expo add expo-document-picker
// expo add expo-sharing
// expo add expo-dev-client

/*
  For testing expo-document-picker on iOS we need a standalone app 
  which is why we install expo-dev-client
  
  If you don't have eas installed then install using the following command:
  npm install -g eas-cli
  eas login
  eas build:configure
  Build for local development on iOS or Android:
  eas build -p ios --profile development --local
  OR
  eas build -p android --profile development --local
  May need to install the following to build locally (which allows debugging)
  npm install -g yarn
  brew install fastlane
  After building install on your device:
  For iOS (simulator): https://docs.expo.dev/build-reference/simulators/
  For Android: https://docs.expo.dev/build-reference/apk/
  Run on installed app:
  expo start --dev-client
*/


export default function App() {
  const [db, setDb] = useState(SQLite.openDatabase('example.db'));
  const [isLoading, setIsLoading] = useState(true);
  const [names, setNames] = useState<INames[]>([]);
  const [currentName, setCurrentName] = useState<string>('');

  // const exportDb = async () => {
  //   if (Platform.OS === "android") {
  //     const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  //     if (permissions.granted) {
  //       const base64 = await FileSystem.readAsStringAsync(
  //         FileSystem.documentDirectory + 'SQLite/example.db',
  //         {
  //           encoding: FileSystem.EncodingType.Base64
  //         }
  //       );

  //       await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, 'example.db', 'application/octet-stream')
  //       .then(async (uri) => {
  //         await FileSystem.writeAsStringAsync(uri, base64, { encoding : FileSystem.EncodingType.Base64 });
  //       })
  //       .catch((e) => console.log(e));
  //     } else {
  //       console.log("Permission not granted");
  //     }
  //   } else {
  //     await Sharing.shareAsync(FileSystem.documentDirectory + 'SQLite/example.db');
  //   }
  // }

  // const importDb = async () => {
  //   let result = await DocumentPicker.getDocumentAsync({
  //     copyToCacheDirectory: true
  //   });

  //   if (result.type === 'success') {
  //     setIsLoading(true);
      
  //     if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
  //       await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite');
  //     }

  //     const base64 = await FileSystem.readAsStringAsync(
  //       result.uri,
  //       {
  //         encoding: FileSystem.EncodingType.Base64
  //       }
  //     );

  //     await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'SQLite/example.db', base64, { encoding: FileSystem.EncodingType.Base64 });
  //     await db.closeAsync();
  //     setDb(SQLite.openDatabase('example.db'));
  //   }
  // };

  const addName = () => {
    db.transaction(tx => {
      tx.executeSql('INSERT INTO names (name) values (?)', [currentName ?  currentName : null],
        (txObj, resultSet) => {
          let existingNames: INames[] = [...names];
          existingNames.push({ id: resultSet.insertId || 0, name: currentName});
          setNames(existingNames);
          setCurrentName('');
        },
        (txObj, error) => console.log(error) as any
      );
    });
  }

  const deleteName = (id: number) => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM names WHERE id = ?', [id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let existingNames = [...names].filter(name => name?.id !== id);
            setNames(existingNames);
          }
        },
        (txObj, error) => console.log(error) as any
      );
    });
  };

  const updateName = (id: number) => {
    db.transaction(tx => {
      tx.executeSql('UPDATE names SET name = ? WHERE id = ?', [currentName, id],
        (txObj, resultSet) => {
          if (resultSet.rowsAffected > 0) {
            let existingNames = [...names];
            const indexToUpdate = existingNames.findIndex(name => name?.id === id);
            existingNames[indexToUpdate].name = currentName;
            setNames(existingNames);
            setCurrentName('');
          }
        },
        (txObj, error) => console.log(error) as any
      );
    });
  };

  const showNames = () => {
    return names.map((name, index) => {
      return (
        <View key={index} style={styles.row}>
          <Text>{name?.name}</Text>
          <Button title='Delete' onPress={() => deleteName(name.id)} />
          <Button title='Update' onPress={() => updateName(name.id)} />
        </View>
      );
    });
  };

  useEffect(() => {
    db.transaction(tx => {
      tx.executeSql('CREATE TABLE IF NOT EXISTS names (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)')
    });

    db.transaction(tx => {
      tx.executeSql('SELECT * FROM names', [null],
        (txObj, resultSet: any) => setNames(resultSet.rows._array),
        (txObj, error) => console.log(error) as any
      );
    });

    setIsLoading(false);
  }, [db]);

  return (
    <View style={styles.container}>
      <TextInput value={currentName} placeholder='name' onChangeText={setCurrentName} />
      <Button title="Add Name" onPress={addName} disabled={currentName.length < 2} />
      {showNames()}
      {/* <Button title="Export Db" onPress={exportDb} />
      <Button title="Import Db" onPress={importDb} /> */}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    margin: 8
  }
});
