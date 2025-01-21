import httpClient from '../httpClient';
import { AutocompleteResponse, toAutocompleteItem, } from './dto/autocompleteItem';
import { SearchParams } from './dto/searchParams';
import { mockAutocompleteResponse } from './dto/__mock__/autocomplete.mock';


const useMock = process.env.USE_MOCK === 'true';

export const fetchAutocompleteDatra = async (params: SearchParams): Promise<AutocompleteResponse> => {
    try {
        if (useMock) {
            return mockAutocompleteResponse;
        }

        const response = await httpClient.get('/some-endpoint', { params });

        return response.data.map(toAutocompleteItem); // Transform the raw data using the DTO
    } catch (error) {
        console.error('Error fetching some data:', error);
        throw new Error('Failed to fetch data');
    }
};