import React from "react";
import { TouchableOpacity, Text, StyleSheet, View, Dimensions } from "react-native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { User, UserCircle } from "lucide-react-native";

const {width, height}=Dimensions.get("window")

interface TagButtonProps {
	tag: string;
	isSelected: boolean;
	onPress: () => void;
}

const TagButton: React.FC<TagButtonProps> = ({ tag, isSelected, onPress }) => {
	return (
		<TouchableOpacity
			style={[styles.tagButton, isSelected && styles.selectedTag]}
			onPress={onPress}
		>
				<Text style={[styles.tagText, isSelected && styles.selectedTagText]}>
					{tag}
				</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	tagButton: {
		backgroundColor: Colors.tags,
		paddingHorizontal: 16,
		paddingVertical: 14,
		borderRadius: 10,
		marginRight: 8,
		marginVertical: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	selectedTag: {
		backgroundColor: Colors.background,
		borderColor: Colors.tags,
		borderWidth: 2,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	tagText: {
		color: Colors.background,
		fontFamily: Fonts.Regular,
		fontSize: width * 0.038,
	},
	selectedTagText: {
		color: Colors.tags,
		fontFamily: Fonts.Regular,
		fontSize: width * 0.038,
	},
});

export default TagButton;
