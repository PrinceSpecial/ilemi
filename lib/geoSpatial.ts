import * as fs from 'fs/promises';
import * as path from 'path';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection, Polygon, MultiPolygon, Position } from 'geojson';
import booleanIntersects from '@turf/boolean-intersects';

interface IncomingCoordinate {
    Bornes?: string;
    X: string;
    Y: string;
}

interface ExistingFeatureProperties {
    num_tf: string;
    id: number;
    surface?: number | null;
    tf_alea?: number;
    [key: string]: string | number | null | undefined;
}

interface GeoJsonCrs {
    type: string;
    properties: Record<string, unknown>;
}

interface OverlapResult {
    fileName: string;
    document: string;
    featureId: string | number;
    properties: ExistingFeatureProperties;
    coordinates: Position[][] | Position[][][] | undefined;
    feature: Feature<Polygon | MultiPolygon, ExistingFeatureProperties>;
    crs?: GeoJsonCrs;
}

interface YesNoData {
    [key: string]: string;
}

export function createPolygonFeatureFromIncomingCoordinates(coords: IncomingCoordinate[]): Feature<Polygon> {
    if (coords.length < 3) {
        throw new Error("A polygon must have at least 3 unique coordinates.");
    }

    const positions: Position[] = coords.map(p => [parseFloat(p.X), parseFloat(p.Y)]);

    if (positions.length > 0 && (positions[0][0] !== positions[positions.length - 1][0] || positions[0][1] !== positions[positions.length - 1][1])) {
        positions.push(positions[0]);
    }

    return turf.polygon([positions]);
}

interface LoadedGeojsonData {
    features: Feature<Polygon | MultiPolygon, ExistingFeatureProperties>[];
    crs?: GeoJsonCrs;
}

export async function loadGeojsonFeaturesFromFile(filePath: string): Promise<LoadedGeojsonData> {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
    const geojson = JSON.parse(fileContent) as FeatureCollection & { crs?: GeoJsonCrs };
        const features: Feature<Polygon | MultiPolygon, ExistingFeatureProperties>[] = [];
        let crs: GeoJsonCrs | undefined;

        if (geojson.type === 'FeatureCollection') {
            if (geojson.crs && typeof geojson.crs === 'object') {
                const candidate = geojson.crs as GeoJsonCrs;
                if (typeof candidate.type === 'string' && typeof candidate.properties === 'object') {
                    crs = candidate;
                }
            }
            for (const feature of geojson.features) {
                if (feature.geometry && (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')) {
                    features.push(feature as Feature<Polygon | MultiPolygon, ExistingFeatureProperties>);
                }
            }
        }
        return { features, crs };
    } catch (error) {
        console.error(`Error loading or parsing GeoJSON file ${filePath}:`, error instanceof Error ? error.message : error);
        return { features: [], crs: undefined };
    }
}

function findOverlappingExistingDataFromIncomingPolygon(
    incomingPolygon: Feature<Polygon>,
    existingFeatures: Feature<Polygon | MultiPolygon, ExistingFeatureProperties>[],
    fileName: string,
    crs?: GeoJsonCrs,
    // isParcelles: boolean = false
): OverlapResult[] {
    const overlappingResults: OverlapResult[] = [];

    for (const existingFeature of existingFeatures) {
        if (existingFeature.geometry && (existingFeature.geometry.type === 'Polygon' || existingFeature.geometry.type === 'MultiPolygon')) {
            const intersects = booleanIntersects(incomingPolygon, existingFeature);

            if (intersects) {
                // if(isParcelles){
                //     console.log(`${fileName}-HERE`);
                //     console.log(existingFeature.properties)
                // }
                // if(isParcelles && existingFeature.properties.num_tf == null) {
                //     console.log('NULL')
                //     continue;
                // }
                overlappingResults.push({
                    fileName: fileName,
                    document: fileName.replace(/\.geojson$/, ''),
                    featureId: existingFeature.properties.num_tf || existingFeature.properties.id,
                    properties: existingFeature.properties,
                    coordinates: existingFeature.geometry.coordinates,
                    feature: existingFeature,
                    crs,
                });
            }
        } else {
            console.warn(`Skipping feature in ${fileName} with unsupported geometry type}`);
        }
    }

    return overlappingResults;
}

export async function processData(
    incomingCoordinates: IncomingCoordinate[],
    existingDataFolderPath: string
): Promise<{ overlaps: OverlapResult[], yesNoData: YesNoData }> {
    const overlappingResults: OverlapResult[] = [];
    const yesNoData: YesNoData = {};

    let incomingPolygon: Feature<Polygon>;
    try {
        incomingPolygon = createPolygonFeatureFromIncomingCoordinates(incomingCoordinates);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Error creating incoming polygon:", error.message);
        return { overlaps: [], yesNoData };
    }

    let fileNames: string[];
    try {
        fileNames = await fs.readdir(existingDataFolderPath);
    } catch (error) {
        console.error(`Error reading existing data folder ${existingDataFolderPath}:`, error instanceof Error ? error.message : error);
        return { overlaps: [], yesNoData };
    }

    for (const fileName of fileNames) {
        if (!fileName.endsWith('.geojson')) {
            console.log(`Skipping non-JSON file: ${fileName}`);
            continue;
        }

        const documentName = fileName.replace(/\.geojson$/, '');
        yesNoData[documentName] = "NON";

        const filePath = path.join(existingDataFolderPath, fileName);
        const { features: existingFeaturesInFile, crs } = await loadGeojsonFeaturesFromFile(filePath);

        let overlapsInFile;

        switch (documentName) {
            case 'dpl' :
            case 'dpm' : {
                overlapsInFile = belowExistingFeature(incomingPolygon, existingFeaturesInFile, fileName, crs);
                break;
            }
            case 'parcelles' : {
                overlapsInFile = findOverlappingExistingDataFromIncomingPolygon(incomingPolygon, existingFeaturesInFile, fileName, crs);
                break;
            }
            default: {
                overlapsInFile = findOverlappingExistingDataFromIncomingPolygon(incomingPolygon, existingFeaturesInFile, fileName, crs);
                break;
            }
        }

        if (overlapsInFile.length > 0) {
            yesNoData[fileName.replace(/\.geojson$/, '')] = "OUI";
            overlappingResults.push(...overlapsInFile);
        }
    }
    return { overlaps: overlappingResults, yesNoData };
}



// export async function findOverlappingExistingDataInFolder(
//     incomingCoordinates: IncomingCoordinate[],
//     existingDataFolderPath: string
// ): Promise<{ overlaps: OverlapResult[], yesNoData: YesNoData }> {
//     const overlappingResults: OverlapResult[] = [];
//     const yesNoData: YesNoData = {};

//     let incomingPolygon: Feature<Polygon>;
//     try {
//         incomingPolygon = createPolygonFeatureFromIncomingCoordinates(incomingCoordinates);
//     } catch (error: any) {
//         console.error("Error creating incoming polygon:", error.message);
//         return { overlaps: [], yesNoData };;
//     }

//     let fileNames: string[];
//     try {
//         fileNames = await fs.readdir(existingDataFolderPath);
//     } catch (error) {
//         console.error(`Error reading existing data folder ${existingDataFolderPath}:`, error instanceof Error ? error.message : error);
//         return { overlaps: [], yesNoData };;
//     }

//     // for (const fileName of fileNames) {
//     //     if (fileName.endsWith('.geojson')) {
//     //         yesNoData[fileName.replace(/\.geojson$/, '')] = "NO";
//     //     }
//     // }

//     // Process each GeoJSON file
//     for (const fileName of fileNames) {
//         if (!fileName.endsWith('.geojson')) {
//             console.log(`Skipping non-JSON file: ${fileName}`);
//             continue;
//         }

//         yesNoData[fileName.replace(/\.geojson$/, '')] = "NON";

//         const filePath = path.join(existingDataFolderPath, fileName);
//         const existingFeaturesInFile = await loadGeojsonFeaturesFromFile(filePath);

//         for (const existingFeature of existingFeaturesInFile) {
//             if (existingFeature.geometry && (existingFeature.geometry.type === 'Polygon' || existingFeature.geometry.type === 'MultiPolygon')) {
//                 const intersects = booleanIntersects(incomingPolygon, existingFeature);

//                 if (intersects) {
//                     yesNoData[fileName.replace(/\.geojson$/, '')] = "OUI";
//                     overlappingResults.push({
//                         fileName: fileName,
//                         document: fileName.replace(/\.geojson$/, ''),
//                         featureId: existingFeature.properties.num_tf || existingFeature.properties.id,
//                         properties: existingFeature.properties,
//                     });
//                 }
//             } else {
//                 console.warn(`Skipping feature in ${fileName} with unsupported geometry type}`);
//             }
//         }
//     }

//     return { overlaps: overlappingResults, yesNoData };
// }


function belowExistingFeature(
    incomingPolygon: Feature<Polygon>,
    existingFeatures: Feature<Polygon | MultiPolygon, ExistingFeatureProperties>[],
    fileName: string,
    crs?: GeoJsonCrs
): OverlapResult[] {
    const overlappingResults: OverlapResult[] = [];

    if (existingFeatures.length === 0) {
        return overlappingResults;
    }

    const incomingBbox = turf.bbox(incomingPolygon);

    for (const existingFeature of existingFeatures) {
        const existingBbox = turf.bbox(existingFeature);

        // Check if the incomingPolygon is below the existingFeature (i.e., south boundary > north boundary)
        if (incomingBbox[1] > existingBbox[3]) {
            overlappingResults.push({
                fileName: fileName,
                document: fileName.replace(/\.geojson$/, ''),
                featureId: existingFeature.properties.num_tf || existingFeature.properties.id,
                properties: existingFeature.properties,
                coordinates: existingFeature.geometry.coordinates,
                feature: existingFeature,
                crs,
            });
        }
    }

    return overlappingResults;
}



// function createPolygonFromIncomingCoordinates(coords: IncomingCoordinate[]): Feature<Polygon> {
//     if (coords.length < 3) {
//         throw new Error("A polygon must have at least 3 unique coordinates.");
//     }

//     const positions: Position[] = coords.map(p => [parseFloat(p.X), parseFloat(p.Y)]);

//     if (positions.length > 0 && (positions[0][0] !== positions[positions.length - 1][0] || positions[0][1] !== positions[positions.length - 1][1])) {
//         positions.push(positions[0]);
//     }

//     return turf.polygon([positions]);
// }