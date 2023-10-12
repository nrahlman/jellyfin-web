import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import React, { FC, useCallback } from 'react';
import Box from '@mui/material/Box';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useGetItem, useGetItemsViewByType } from 'hooks/useFetchItems';
import { getDefaultLibraryViewSettings, getSettingsKey } from 'utils/items';
import Loading from 'components/loading/LoadingComponent';
import listview from 'components/listview/listview';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'scripts/globalize';
import AlphabetPicker from './AlphabetPicker';
import FilterButton from './filter/FilterButton';
import ItemsContainer from './ItemsContainer';
import NewCollectionButton from './NewCollectionButton';
import Pagination from './Pagination';
import PlayAllButton from './PlayAllButton';
import QueueButton from './QueueButton';
import ShuffleButton from './ShuffleButton';
import SortButton from './SortButton';
import GridListViewButton from './GridListViewButton';
import { LibraryViewSettings, ParentId, ViewMode } from 'types/library';
import { CollectionType } from 'types/collectionType';
import { LibraryTab } from 'types/libraryTab';

import { CardOptions } from 'types/cardOptions';

interface ItemsViewProps {
    viewType: LibraryTab;
    parentId: ParentId;
    itemType: BaseItemKind[];
    collectionType?: CollectionType;
    isBtnPlayAllEnabled?: boolean;
    isBtnQueueEnabled?: boolean;
    isBtnShuffleEnabled?: boolean;
    isBtnSortEnabled?: boolean;
    isBtnFilterEnabled?: boolean;
    isBtnNewCollectionEnabled?: boolean;
    isBtnGridListEnabled?: boolean;
    isAlphabetPickerEnabled?: boolean;
    noItemsMessage: string;
}

const ItemsView: FC<ItemsViewProps> = ({
    viewType,
    parentId,
    collectionType,
    isBtnPlayAllEnabled = false,
    isBtnQueueEnabled = false,
    isBtnShuffleEnabled = false,
    isBtnSortEnabled = true,
    isBtnFilterEnabled = true,
    isBtnNewCollectionEnabled = false,
    isBtnGridListEnabled = true,
    isAlphabetPickerEnabled = true,
    itemType,
    noItemsMessage
}) => {
    const [libraryViewSettings, setLibraryViewSettings] =
        useLocalStorage<LibraryViewSettings>(
            getSettingsKey(viewType, parentId),
            getDefaultLibraryViewSettings(viewType)
        );

    const {
        isLoading,
        data: itemsResult,
        isPreviousData
    } = useGetItemsViewByType(
        viewType,
        parentId,
        itemType,
        libraryViewSettings
    );
    const { data: item } = useGetItem(parentId);

    const getCardOptions = useCallback(() => {
        let shape;
        let preferThumb;
        let preferDisc;
        let preferLogo;
        let lines = libraryViewSettings.ShowTitle ? 2 : 0;

        if (libraryViewSettings.ImageType === ImageType.Banner) {
            shape = 'banner';
        } else if (libraryViewSettings.ImageType === ImageType.Disc) {
            shape = 'square';
            preferDisc = true;
        } else if (libraryViewSettings.ImageType === ImageType.Logo) {
            shape = 'backdrop';
            preferLogo = true;
        } else if (libraryViewSettings.ImageType === ImageType.Thumb) {
            shape = 'backdrop';
            preferThumb = true;
        } else {
            shape = 'auto';
        }

        const cardOptions: CardOptions = {
            shape: shape,
            showTitle: libraryViewSettings.ShowTitle,
            showYear: libraryViewSettings.ShowYear,
            cardLayout: libraryViewSettings.CardLayout,
            centerText: true,
            context: collectionType,
            coverImage: true,
            preferThumb: preferThumb,
            preferDisc: preferDisc,
            preferLogo: preferLogo,
            overlayPlayButton: false,
            overlayMoreButton: true,
            overlayText: !libraryViewSettings.ShowTitle
        };

        if (
            viewType === LibraryTab.Songs
            || viewType === LibraryTab.Albums
            || viewType === LibraryTab.Episodes
        ) {
            cardOptions.showParentTitle = libraryViewSettings.ShowTitle;
        } else if (viewType === LibraryTab.Artists) {
            cardOptions.showYear = false;
            lines = 1;
        }

        cardOptions.lines = lines;

        return cardOptions;
    }, [
        libraryViewSettings.ShowTitle,
        libraryViewSettings.ImageType,
        libraryViewSettings.ShowYear,
        libraryViewSettings.CardLayout,
        collectionType,
        viewType
    ]);

    const getItemsHtml = useCallback(() => {
        let html = '';

        if (libraryViewSettings.ViewMode === ViewMode.ListView) {
            html = listview.getListViewHtml({
                items: itemsResult?.Items ?? [],
                context: collectionType
            });
        } else {
            html = cardBuilder.getCardsHtml(
                itemsResult?.Items ?? [],
                getCardOptions()
            );
        }

        if (!itemsResult?.Items?.length) {
            html += '<div class="noItemsMessage centerMessage">';
            html += '<h1>' + globalize.translate('MessageNothingHere') + '</h1>';
            html += '<p>' + globalize.translate(noItemsMessage) + '</p>';
            html += '</div>';
        }

        return html;
    }, [
        libraryViewSettings.ViewMode,
        itemsResult?.Items,
        collectionType,
        getCardOptions,
        noItemsMessage
    ]);

    const totalRecordCount = itemsResult?.TotalRecordCount ?? 0;
    const items = itemsResult?.Items ?? [];
    const hasFilters = Object.values(libraryViewSettings.Filters ?? {}).some(
        (filter) => !!filter
    );
    const hasSortName = libraryViewSettings.SortBy.includes(
        ItemSortBy.SortName
    );

    return (
        <Box>
            <Box className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination
                    totalRecordCount={totalRecordCount}
                    libraryViewSettings={libraryViewSettings}
                    isPreviousData={isPreviousData}
                    setLibraryViewSettings={setLibraryViewSettings}
                />

                {isBtnPlayAllEnabled && (
                    <PlayAllButton
                        item={item}
                        items={items}
                        viewType={viewType}
                        hasFilters={hasFilters}
                        libraryViewSettings={libraryViewSettings}
                    />
                )}
                {isBtnQueueEnabled
                    && item
                    && playbackManager.canQueue(item) && (
                    <QueueButton
                        item={item}
                        items={items}
                        hasFilters={hasFilters}
                    />
                )}
                {isBtnShuffleEnabled && totalRecordCount > 1 && (
                    <ShuffleButton
                        item={item}
                        items={items}
                        viewType={viewType}
                        hasFilters={hasFilters}
                        libraryViewSettings={libraryViewSettings}
                    />
                )}
                {isBtnSortEnabled && (
                    <SortButton
                        viewType={viewType}
                        libraryViewSettings={libraryViewSettings}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                )}
                {isBtnFilterEnabled && (
                    <FilterButton
                        parentId={parentId}
                        itemType={itemType}
                        viewType={viewType}
                        hasFilters={hasFilters}
                        libraryViewSettings={libraryViewSettings}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                )}
                {isBtnNewCollectionEnabled && <NewCollectionButton />}
                {isBtnGridListEnabled && (
                    <GridListViewButton
                        viewType={viewType}
                        libraryViewSettings={libraryViewSettings}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                )}
            </Box>

            {isAlphabetPickerEnabled && hasSortName && (
                <AlphabetPicker
                    libraryViewSettings={libraryViewSettings}
                    setLibraryViewSettings={setLibraryViewSettings}
                />
            )}

            {isLoading ? (
                <Loading />
            ) : (
                <ItemsContainer
                    libraryViewSettings={libraryViewSettings}
                    getItemsHtml={getItemsHtml}
                />
            )}

            <Box className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination
                    totalRecordCount={totalRecordCount}
                    libraryViewSettings={libraryViewSettings}
                    isPreviousData={isPreviousData}
                    setLibraryViewSettings={setLibraryViewSettings}
                />
            </Box>
        </Box>
    );
};

export default ItemsView;
