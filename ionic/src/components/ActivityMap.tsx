
import React, { useEffect, useState } from 'react';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonModal,
    IonTitle,
    IonToolbar,
    createAnimation
} from '@ionic/react';
import {
    MapContainer,
    Marker,
    TileLayer,
    useMap,
    useMapEvents
} from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';
import 'leaflet/dist/leaflet.css';

export interface MapLocation {
    latitude: number;
    longitude: number;
}

interface ActivityMapProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (location: MapLocation) => void;
    latitude?: number | null;
    longitude?: number | null;
    readonly?: boolean;
}

const markerIcon = new Icon({
    iconUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const defaultLocation: MapLocation = {
    latitude: 46.7712,
    longitude: 23.6236
};

const MapClickHandler: React.FC<{
    readonly: boolean;
    onChange: (location: MapLocation) => void;
}> = ({ readonly, onChange }) => {
    useMapEvents({
        click(event) {
            if (!readonly) {
                onChange({
                    latitude: event.latlng.lat,
                    longitude: event.latlng.lng
                });
            }
        }
    });

    return null;
};

const MapController: React.FC<{
    location: MapLocation;
}> = ({ location }) => {
    const map = useMap();

    useEffect(() => {
        map.setView([
            location.latitude,
            location.longitude
        ]);
    }, [map, location.latitude, location.longitude]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            map.invalidateSize();
        }, 450);

        return () => window.clearTimeout(timeout);
    }, [map]);

    return null;
};

const mapEnterAnimation = (baseEl: HTMLElement) => {
    const backdrop = baseEl.shadowRoot?.querySelector('ion-backdrop');
    const wrapper = baseEl.shadowRoot?.querySelector('.modal-wrapper');

    const backdropAnimation = createAnimation()
        .addElement(backdrop ? backdrop : baseEl)
        .fromTo('opacity', '0', '1');

    const wrapperAnimation = createAnimation()
        .addElement(wrapper ? wrapper : baseEl)
        .keyframes([
            { offset: 0, opacity: '0', transform: 'translateY(100%)' },
            { offset: 1, opacity: '1', transform: 'translateY(0)' }
        ]);

    return createAnimation()
        .duration(350)
        .easing('cubic-bezier(0.32, 0.72, 0, 1)')
        .addAnimation([
            backdropAnimation,
            wrapperAnimation
        ]);
};

const mapLeaveAnimation = (baseEl: HTMLElement) => {
    const backdrop = baseEl.shadowRoot?.querySelector('ion-backdrop');
    const wrapper = baseEl.shadowRoot?.querySelector('.modal-wrapper');

    const backdropAnimation = createAnimation()
        .addElement(backdrop ? backdrop : baseEl)
        .fromTo('opacity', '1', '0');

    const wrapperAnimation = createAnimation()
        .addElement(wrapper ? wrapper : baseEl)
        .keyframes([
            { offset: 0, opacity: '1', transform: 'translateY(0)' },
            { offset: 1, opacity: '0', transform: 'translateY(100%)' }
        ]);

    return createAnimation()
        .duration(250)
        .easing('ease-in')
        .addAnimation([
            backdropAnimation,
            wrapperAnimation
        ]);
};

const ActivityMap: React.FC<ActivityMapProps> = ({
                                                     isOpen,
                                                     onClose,
                                                     onSelect,
                                                     latitude,
                                                     longitude,
                                                     readonly = false
                                                 }) => {
    const [selected, setSelected] =
        useState<MapLocation>(defaultLocation);

    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        setError('');

        if (
            latitude != null &&
            longitude != null
        ) {
            setSelected({ latitude, longitude });
        } else {
            setSelected(defaultLocation);
        }
    }, [isOpen, latitude, longitude]);

    const useCurrentLocation = async () => {
        try {
            setError('');

            const position =
                await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000
                });

            setSelected({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });
        } catch {
            setError('Could not get current location');
        }
    };

    const confirmLocation = () => {
        onSelect?.(selected);
        onClose();
    };

    const center: LatLngExpression = [
        selected.latitude,
        selected.longitude
    ];

    return (
        <IonModal
            isOpen={isOpen}
            onDidDismiss={onClose}
            enterAnimation={mapEnterAnimation}
            leaveAnimation={mapLeaveAnimation}
        >
            <IonHeader>
                <IonToolbar>
                    <IonTitle>
                        {readonly
                            ? 'Activity Location'
                            : 'Select Location'}
                    </IonTitle>

                    <IonButtons slot="end">
                        <IonButton onClick={onClose}>
                            Close
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <div
                    style={{
                        height: '65vh',
                        width: '100%'
                    }}
                >
                    {isOpen && (
                        <MapContainer
                            center={center}
                            zoom={14}
                            style={{
                                height: '100%',
                                width: '100%'
                            }}
                        >
                            <TileLayer
                                attribution='&copy; OpenStreetMap contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <Marker
                                position={center}
                                icon={markerIcon}
                            />

                            <MapClickHandler
                                readonly={readonly}
                                onChange={setSelected}
                            />

                            <MapController
                                location={selected}
                            />
                        </MapContainer>
                    )}
                </div>

                <div className="ion-padding">
                    <p>
                        Latitude: {selected.latitude.toFixed(6)}
                    </p>

                    <p>
                        Longitude: {selected.longitude.toFixed(6)}
                    </p>

                    {error && (
                        <p style={{ color: 'var(--ion-color-danger)' }}>
                            {error}
                        </p>
                    )}

                    {!readonly && (
                        <>
                            <IonButton
                                expand="block"
                                fill="outline"
                                onClick={useCurrentLocation}
                            >
                                Use Current Location
                            </IonButton>

                            <IonButton
                                expand="block"
                                onClick={confirmLocation}
                            >
                                Confirm Location
                            </IonButton>
                        </>
                    )}
                </div>
            </IonContent>
        </IonModal>
    );
};

export default ActivityMap;
