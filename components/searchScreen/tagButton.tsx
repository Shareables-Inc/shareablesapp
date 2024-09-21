import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import Colors from "../../utils/colors";
import { Fonts } from "../../utils/fonts";
import { User, UserCircle } from "lucide-react-native";

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
			{tag === "Friends" ? (
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<User size={20} color={Colors.background} />
					<Text style={[styles.tagText, isSelected && styles.selectedTagText]}>
						{tag}
					</Text>
				</View>
			) : (
				<Text style={[styles.tagText, isSelected && styles.selectedTagText]}>
					{tag}
				</Text>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	tagButton: {
		backgroundColor: Colors.tags,
		paddingHorizontal: 14,
		paddingVertical: 14,
		borderRadius: 10,
		marginRight: 8,
		marginVertical: 8,
		minWidth: 80,
		alignItems: "center",
		justifyContent: "center",
	},
	selectedTag: {
		backgroundColor: Colors.highlightText,
	},
	tagText: {
		color: Colors.background,
		fontFamily: Fonts.Light,
		fontSize: 14,
	},
	selectedTagText: {
		fontFamily: Fonts.Medium,
	},
});

export default TagButton;
