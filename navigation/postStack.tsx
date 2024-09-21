import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PostScreen from '../screens/tabs/post';

export type PostStackParamList = {
    PostPage: undefined;
    };

const PostStack = () => {
    const Stack = createStackNavigator<PostStackParamList>();


  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PostPage" component={PostScreen} />
    </Stack.Navigator>
  );
}

export default PostStack;