import React, { useCallback, useEffect, useRef } from "react";
import {
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  View,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Platform,
  TouchableOpacity,
  Text,
  Animated,
} from "react-native";
import { Fonts } from "../../utils/fonts";
import { useNavigation } from "@react-navigation/native";
import SinglePhoto from "../../components/posts/singlePhoto";
import TwoPhotoScroll from "../../components/posts/twoPhotoScroll";
import TwoPhotoGrid from "../../components/posts/twoPhotoGrid";
import ThreePhotoScroll from "../../components/posts/threePhotoScroll";
import ThreePhotoGrid from "../../components/posts/threePhotoGrid";
import Colors from "../../utils/colors";
import { usePostPaginated } from "../../hooks/usePost";
import type { RootStackParamList } from "../../types/stackParams.types";
import type { NavigationProp } from "@react-navigation/native";
import SkeletonFeed from "../../components/skeleton/skeletonFeed";
import { Post } from "../../models/post";

const { width, height } = Dimensions.get("window");

const FeedScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = usePostPaginated(10);

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  useEffect(() => {
    refetch();
  }, []);

  const handlePostPress = useCallback(
    (post: Post) => {
      return navigation.navigate("ExpandedPost", { postId: post.id });
    },
    [navigation]
  );

  const renderPost = useCallback(
    ({ item, index }) => {
      const PostComponent = (() => {
        switch (item.imageComponent) {
          case "singlePhoto":
            return SinglePhoto;
          case "TwoPhotoScroll":
            return TwoPhotoScroll;
          case "TwoPhotoGrid":
            return TwoPhotoGrid;
          case "ThreePhotoScroll":
            return ThreePhotoScroll;
          case "ThreePhotoGrid":
            return ThreePhotoGrid;
          default:
            return SinglePhoto;
        }
      })();

      return (
        <TouchableOpacity
          key={`post-${item.id}-${index}`}
          onPress={() => handlePostPress(item)}
        >
          <PostComponent post={item} />
        </TouchableOpacity>
      );
    },
    [handlePostPress]
  );

  const isAndroid = Platform.OS === "android";

  return (
    <>
      {isLoading ? (
        <FlatList
          data={[1, 2, 3]} // Show 3 skeleton items
          renderItem={() => <SkeletonFeed />}
          keyExtractor={(item) => item.toString()}
          showsVerticalScrollIndicator={false}
          style={{
            paddingTop:
              Platform.OS === "android" ? height * 0.1 : height * 0.045,
          }}
        />
      ) : posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Looks like there aren't any posts yet. Be the first to share your
            culinary adventure!
          </Text>
        </View>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item, index) => `post-${item.id}-${index}`}
          onEndReached={() => {
            if (!isFetchingNextPage && hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() =>
            isFetchingNextPage ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="large" color={Colors.highlightText} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch} // Use refetch instead of fetch
              tintColor={Colors.highlightText}
              colors={[Colors.highlightText]}
            />
          }
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footerLoading: {
    paddingVertical: height * 0.05,
    alignItems: "center",
  },
  refreshControl: {},
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: width * 0.07,
  },
  emptyText: {
    fontSize: height * 0.02,
    fontFamily: Fonts.Medium,
    color: Colors.text,
    textAlign: "center",
    marginBottom: height * 0.02,
  },
});

export default FeedScreen;
