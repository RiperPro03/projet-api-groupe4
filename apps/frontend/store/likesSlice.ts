import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

type LikeTargetType = "post" | "comment";

type LikeState = {
  likesCount: number;
  isLiked: boolean;
};

type LikesSliceState = {
  entities: Record<string, LikeState>;
};

type LikePayload = {
  targetType: LikeTargetType;
  targetId: string;
};

type HydrateLikePayload = LikePayload & {
  likesCount: number;
  isLiked?: boolean;
};

const initialState: LikesSliceState = {
  entities: {},
};

function getLikeKey(targetType: LikeTargetType, targetId: string) {
  return `${targetType}:${targetId}`;
}

export const likesSlice = createSlice({
  name: "likes",
  initialState,
  reducers: {
    hydrateLike(state, action: PayloadAction<HydrateLikePayload>) {
      const key = getLikeKey(action.payload.targetType, action.payload.targetId);

      state.entities[key] = {
        likesCount: action.payload.likesCount,
        isLiked: action.payload.isLiked ?? false,
      };
    },
    markLiked(state, action: PayloadAction<LikePayload>) {
      const key = getLikeKey(action.payload.targetType, action.payload.targetId);
      const current = state.entities[key] ?? {
        likesCount: 0,
        isLiked: false,
      };

      state.entities[key] = {
        likesCount: current.isLiked ? current.likesCount : current.likesCount + 1,
        isLiked: true,
      };
    },
    markUnliked(state, action: PayloadAction<LikePayload>) {
      const key = getLikeKey(action.payload.targetType, action.payload.targetId);
      const current = state.entities[key] ?? {
        likesCount: 0,
        isLiked: false,
      };

      state.entities[key] = {
        likesCount: current.isLiked
          ? Math.max(0, current.likesCount - 1)
          : current.likesCount,
        isLiked: false,
      };
    },
  },
});

export const { hydrateLike, markLiked, markUnliked } = likesSlice.actions;

export function selectLikeState(
  state: RootState,
  targetType: LikeTargetType,
  targetId: string
) {
  return state.likes.entities[getLikeKey(targetType, targetId)];
}

export default likesSlice.reducer;
