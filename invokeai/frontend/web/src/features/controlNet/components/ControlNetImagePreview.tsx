import { memo, useCallback, useMemo, useState } from 'react';
import { ImageDTO } from 'services/api/types';
import {
  ControlNetConfig,
  controlNetImageChanged,
  controlNetSelector,
} from '../store/controlNetSlice';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { Box, Flex, SystemStyleObject } from '@chakra-ui/react';
import IAIDndImage from 'common/components/IAIDndImage';
import { createSelector } from '@reduxjs/toolkit';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import { IAILoadingImageFallback } from 'common/components/IAIImageFallback';
import IAIIconButton from 'common/components/IAIIconButton';
import { FaUndo } from 'react-icons/fa';
import { useGetImageDTOQuery } from 'services/api/endpoints/images';
import { skipToken } from '@reduxjs/toolkit/dist/query';
import {
  TypesafeDraggableData,
  TypesafeDroppableData,
} from 'app/components/ImageDnd/typesafeDnd';
import { PostUploadAction } from 'services/api/thunks/image';

const selector = createSelector(
  controlNetSelector,
  (controlNet) => {
    const { pendingControlImages } = controlNet;
    return { pendingControlImages };
  },
  defaultSelectorOptions
);

type Props = {
  controlNet: ControlNetConfig;
  height: SystemStyleObject['h'];
};

const ControlNetImagePreview = (props: Props) => {
  const { height } = props;
  const {
    controlNetId,
    controlImage: controlImageName,
    processedControlImage: processedControlImageName,
    processorType,
  } = props.controlNet;
  const dispatch = useAppDispatch();
  const { pendingControlImages } = useAppSelector(selector);

  const [isMouseOverImage, setIsMouseOverImage] = useState(false);

  const {
    currentData: controlImage,
    isLoading: isLoadingControlImage,
    isError: isErrorControlImage,
    isSuccess: isSuccessControlImage,
  } = useGetImageDTOQuery(controlImageName ?? skipToken);

  const {
    currentData: processedControlImage,
    isLoading: isLoadingProcessedControlImage,
    isError: isErrorProcessedControlImage,
    isSuccess: isSuccessProcessedControlImage,
  } = useGetImageDTOQuery(processedControlImageName ?? skipToken);

  const handleResetControlImage = useCallback(() => {
    dispatch(controlNetImageChanged({ controlNetId, controlImage: null }));
  }, [controlNetId, dispatch]);
  const handleMouseEnter = useCallback(() => {
    setIsMouseOverImage(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsMouseOverImage(false);
  }, []);

  const draggableData = useMemo<TypesafeDraggableData | undefined>(() => {
    if (controlImage) {
      return {
        id: controlNetId,
        payloadType: 'IMAGE_DTO',
        payload: { imageDTO: controlImage },
      };
    }
  }, [controlImage, controlNetId]);

  const droppableData = useMemo<TypesafeDroppableData | undefined>(() => {
    if (controlNetId) {
      return {
        id: controlNetId,
        actionType: 'SET_CONTROLNET_IMAGE',
        context: { controlNetId },
      };
    }
  }, [controlNetId]);

  const postUploadAction = useMemo<PostUploadAction>(
    () => ({ type: 'SET_CONTROLNET_IMAGE', controlNetId }),
    [controlNetId]
  );

  const shouldShowProcessedImage =
    controlImage &&
    processedControlImage &&
    !isMouseOverImage &&
    !pendingControlImages.includes(controlNetId) &&
    processorType !== 'none';

  return (
    <Flex
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'relative',
        w: 'full',
        h: height,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <IAIDndImage
        draggableData={draggableData}
        droppableData={droppableData}
        imageDTO={controlImage}
        isDropDisabled={shouldShowProcessedImage}
        onClickReset={handleResetControlImage}
        postUploadAction={postUploadAction}
        resetTooltip="Reset Control Image"
        withResetIcon={Boolean(controlImage)}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          insetInlineStart: 0,
          w: 'full',
          h: 'full',
          opacity: shouldShowProcessedImage ? 1 : 0,
          transitionProperty: 'common',
          transitionDuration: 'normal',
          pointerEvents: 'none',
        }}
      >
        <IAIDndImage
          draggableData={draggableData}
          droppableData={droppableData}
          imageDTO={processedControlImage}
          isUploadDisabled={true}
          onClickReset={handleResetControlImage}
          resetTooltip="Reset Control Image"
          withResetIcon={Boolean(controlImage)}
        />
      </Box>
      {pendingControlImages.includes(controlNetId) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            insetInlineStart: 0,
            w: 'full',
            h: 'full',
            objectFit: 'contain',
          }}
        >
          <IAILoadingImageFallback image={controlImage} />
        </Box>
      )}
    </Flex>
  );
};

export default memo(ControlNetImagePreview);
