export enum GenderEnum {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other",
}

// Helper để hiển thị label tiếng Việt
export const getGenderLabel = (gender?: string) => {
    switch (gender) {
        case GenderEnum.MALE: return 'Nam';
        case GenderEnum.FEMALE: return 'Nữ';
        case GenderEnum.OTHER: return 'Khác';
        default: return 'Chưa cập nhật';
    }
};