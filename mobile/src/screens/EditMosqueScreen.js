import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Switch, TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator, Image } from 'react-native';
import { theme } from '../theme';
import { suggestMosqueEdit, uploadImage } from '../services/api';
import { governorates as GOVS, fetchDelegations, fetchCities } from '../services/locations';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EditMosqueScreen({ route, navigation }) {
  const { mosque } = route.params;
  
  const [form, setForm] = useState({
    arabic_name: mosque.arabic_name || '',
    type: mosque.type || 'جامع',
    governorate: mosque.governorate || '',
    delegation: mosque.delegation || '',
    city: mosque.city || '',
    address: mosque.address || '',
    latitude: mosque.latitude ? String(mosque.latitude) : '',
    longitude: mosque.longitude ? String(mosque.longitude) : '',
    
    // Detailed Facilities
    women_section: mosque.facilities?.women_section || false,
    wudu: mosque.facilities?.wudu || false,
    men_bathrooms: mosque.facilities?.men_bathrooms || false,
    women_bathrooms: mosque.facilities?.women_bathrooms || false,
    parking: mosque.facilities?.parking || false,
    accessibility: mosque.facilities?.accessibility || false,
    ac: mosque.facilities?.ac || false,
    library: mosque.facilities?.library || false,
    quran_school: mosque.facilities?.quran_school || false,
    daily_prayers: mosque.facilities?.daily_prayers || false,
    jumua_prayer: mosque.facilities?.jumua_prayer || false,
    morgue: mosque.facilities?.morgue || false,
    
    // Staff
    muazzin_name: mosque.muazzin_name || '',
    imam_5_prayers_name: mosque.imam_5_prayers_name || '',
    imam_jumua_name: mosque.imam_jumua_name || '',
    
    // Timings
    jumuah_time: mosque.jumuah_time || '',
    iqama_fajr: mosque.iqama_times?.fajr || '',
    iqama_dhuhr: mosque.iqama_times?.dhuhr || '',
    iqama_asr: mosque.iqama_times?.asr || '',
    iqama_maghrib: mosque.iqama_times?.maghrib || '',
    iqama_isha: mosque.iqama_times?.isha || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  
  // Locations
  const [govPickerOpen, setGovPickerOpen] = useState(false);
  const [delPickerOpen, setDelPickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [delegations, setDelegations] = useState([]);
  const [cities, setCities] = useState([]);
  
  const [region, setRegion] = useState({
      latitude: mosque.latitude || 34.0,
      longitude: mosque.longitude || 9.6,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
  });
  const [imageUri, setImageUri] = useState(null);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const governorates = GOVS;

  useEffect(() => {
    (async () => {
      if (form.governorate) {
        const list = await fetchDelegations(form.governorate);
        setDelegations(list);
      } else {
        setDelegations([]);
      }
    })();
  }, [form.governorate]);

  useEffect(() => {
    (async () => {
      if (form.governorate && form.delegation) {
        const list = await fetchCities(form.governorate, form.delegation);
        setCities(list);
      } else {
        setCities([]);
      }
    })();
  }, [form.governorate, form.delegation]);


  const handleSubmit = async () => {
      setSubmitting(true);
      try {
          let uploadedUrl = null;
          if (imageUri) {
              uploadedUrl = await uploadImage(imageUri);
          }
          
          const patch = {};
          
          // Helper to check inequality (loose equality to handle number vs string)
          const hasChanged = (newVal, oldVal) => {
             if (newVal === oldVal) return false;
             // handle null/undefined
             if (!newVal && !oldVal) return false;
             if (!newVal && oldVal) return false; // usually we don't clear via empty string unless explicit, but let's assume we don't
             return String(newVal) !== String(oldVal);
          };

          // Basic string fields
          ['arabic_name', 'type', 'governorate', 'delegation', 'city', 'address', 'jumuah_time', 
           'muazzin_name', 'imam_5_prayers_name', 'imam_jumua_name'].forEach(k => {
              if (hasChanged(form[k], mosque[k])) {
                  patch[k] = form[k];
              }
          });
          
          if (form.latitude && form.latitude != mosque.latitude) {
             const lat = parseFloat(form.latitude);
             if (!isNaN(lat)) patch.latitude = lat;
          }
           if (form.longitude && form.longitude != mosque.longitude) {
             const lng = parseFloat(form.longitude);
             if (!isNaN(lng)) patch.longitude = lng;
          }

          if (uploadedUrl) patch.image_url = uploadedUrl;

          // Facilities - Compare objects
          const newFacilities = {
              women_section: !!form.women_section,
              wudu: !!form.wudu,
              men_bathrooms: !!form.men_bathrooms,
              women_bathrooms: !!form.women_bathrooms,
              parking: !!form.parking,
              accessibility: !!form.accessibility,
              ac: !!form.ac,
              library: !!form.library,
              quran_school: !!form.quran_school,
              daily_prayers: !!form.daily_prayers,
              jumua_prayer: !!form.jumua_prayer,
              morgue: !!form.morgue
          };
          
          // Simple deep compare for facilities
          const oldFac = mosque.facilities || {};
          let facilitiesChanged = false;
          for (let key in newFacilities) {
              if (!!newFacilities[key] !== !!oldFac[key]) {
                  facilitiesChanged = true;
                  break;
              }
          }
          if (facilitiesChanged) patch.facilities = newFacilities;

          // Times
          const newTimes = {
              fajr: form.iqama_fajr || "",
              dhuhr: form.iqama_dhuhr || "",
              asr: form.iqama_asr || "",
              maghrib: form.iqama_maghrib || "",
              isha: form.iqama_isha || ""
          };
          const oldTimes = mosque.iqama_times || {};
           let timesChanged = false;
          for (let key in newTimes) {
              if ((newTimes[key] || "") !== (oldTimes[key] || "")) { // Treat null/undefined as empty string
                  timesChanged = true;
                  break;
              }
          }
          if (timesChanged) patch.iqama_times = newTimes;

          if (Object.keys(patch).length === 0) {
              Alert.alert("No Changes", "You haven't changed any fields.");
              setSubmitting(false);
              return;
          }

          await suggestMosqueEdit(mosque.id, patch);
          Alert.alert("Success", "Edit suggestion submitted for community review!");
          navigation.goBack();
      } catch (e) {
          Alert.alert("Error", "Failed to submit: " + (e.response?.data?.message || e.message));
          console.log(e.response?.data);
      } finally {
          setSubmitting(false);
      }
  };

  const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
        }); 
        if (!result.canceled) setImageUri(result.assets[0].uri);
  };
  
  const getAddressFromCoords = async (lat, lon) => {
    try {
      let result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (result.length > 0) {
        const addr = result[0];
        const addressParts = [addr.street, addr.name, addr.district, addr.city, addr.region].filter(p => p && p !== 'null' && p !== 'undefined');
        if (addressParts.length > 0) {
            update('address', addressParts.join(', '));
        }
      }
    } catch (e) {
      console.log("Geocoding error:", e);
    }
  };

  const locateMe = async () => {
      setLoadingLoc(true);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Permission to access location was denied');
            return;
        }
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;
        update('latitude', String(lat));
        update('longitude', String(lon));
        getAddressFromCoords(lat, lon);
      } catch (error) {
          Alert.alert("Location Error", "Could not fetch location. Ensure GPS is enabled.");
      } finally {
          setLoadingLoc(false);
      }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Edit Mosque / اقتراح تعديل</Text>

      {/* Image */}
      <Card titleEn="New Photo (Optional)" titleAr="صورة جديدة (اختياري)">
           <TouchableOpacity onPress={pickImage} style={{height: 150, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderRadius: 8}}>
               {imageUri ? <Image source={{uri: imageUri}} style={{width: '100%', height: '100%', borderRadius: 8}} resizeMode="cover"/> : <Text>Tap to change image / اضغط لتغيير الصورة</Text>}
           </TouchableOpacity>
      </Card>

      {/* Basic Info */}
      <Card titleEn="Basic Information" titleAr="معلومات أساسية">
          <Input 
              labelAr="اسم الجامع" 
              labelEn="Mosque Name (Arabic)" 
              value={form.arabic_name} 
              onChangeText={t=>update('arabic_name', t)} 
          />
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
               <Text style={styles.labelAr}>النوع</Text>
               <Text style={styles.labelEn}>Mosque Type</Text>
          </View>
          <TouchableOpacity style={styles.pickerBtn} onPress={()=>setTypePickerOpen(true)}>
               <Text style={{ textAlign: form.type ? 'left' : 'center', color: form.type ? '#000' : '#888' }}>
                   {form.type || 'اختر... / Select...'}
               </Text>
          </TouchableOpacity>
      </Card>

      {/* Location */}
      <Card titleEn="Location" titleAr="الموقع">
           <PickerField 
                labelEn="Governorate" labelAr="الولاية" 
                value={form.governorate} 
                onPress={()=>setGovPickerOpen(true)} 
           />

           <PickerField 
                labelEn="Delegation" labelAr="المعتمدية" 
                value={form.delegation} 
                onPress={()=>setDelPickerOpen(true)} 
           />
           
           <PickerField 
                labelEn="City/Area" labelAr="العمادة/المنطقة" 
                value={form.city} 
                onPress={()=>setCityPickerOpen(true)} 
           />

           <Input labelEn="Address" labelAr="العنوان" value={form.address} onChangeText={t=>update('address', t)} />
           
           <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10}}>
                <TouchableOpacity onPress={locateMe} style={[styles.btnSmall, { minWidth: 120, justifyContent: 'center' }]} disabled={loadingLoc}>
                    {loadingLoc ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnSmallText}>Use My Location</Text>}
                </TouchableOpacity>
           </View>

           <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10}}>
               <View style={{width: '48%'}}>
                   <Text style={styles.labelEn}>Latitude</Text>
                   <TextInput 
                       style={styles.input} 
                       keyboardType="numeric" 
                       value={String(form.latitude || '')} 
                       onChangeText={t => update('latitude', t)}
                   />
               </View>
               <View style={{width: '48%'}}>
                   <Text style={styles.labelEn}>Longitude</Text>
                   <TextInput 
                       style={styles.input} 
                       keyboardType="numeric" 
                       value={String(form.longitude || '')} 
                       onChangeText={t => update('longitude', t)}
                   />
               </View>
           </View>
           
           <View style={{height: 200, borderRadius: 8, overflow: 'hidden', marginTop: 10, marginBottom: 5}}>
                <MapView style={{flex: 1}} region={region} onPress={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    update('latitude', latitude);
                    update('longitude', longitude);
                    getAddressFromCoords(latitude, longitude);
                }}>
                    {(form.latitude && form.longitude) ? <Marker coordinate={{latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude)}} /> : null}
                </MapView>
           </View>
      </Card>
      
      {/* Facilities */}
      <Card titleEn="Facilities" titleAr="المرافق">
          <Toggle labelEn="Women's Section" labelAr="مصلى نساء" value={form.women_section} onValueChange={v=>update('women_section', v)} />
          <Toggle labelEn="Wudu Area" labelAr="ميضأة" value={form.wudu} onValueChange={v=>update('wudu', v)} />
          <Toggle labelEn="Accessible" labelAr="تسهيلات ذوي الاحتياجات" value={form.accessibility} onValueChange={v=>update('accessibility', v)} />
          <Toggle labelEn="Parking" labelAr="موقف سيارات" value={form.parking} onValueChange={v=>update('parking', v)} />
          <Toggle labelEn="Air Conditioning" labelAr="مكيف" value={form.ac} onValueChange={v=>update('ac', v)} />
          <Toggle labelEn="Library" labelAr="مكتبة" value={form.library} onValueChange={v=>update('library', v)} />
          <Toggle labelEn="Quran School" labelAr="كتاب" value={form.quran_school} onValueChange={v=>update('quran_school', v)} />
          <Toggle labelEn="Funeral Prayer" labelAr="صلاة الجنازة" value={form.morgue} onValueChange={v=>update('morgue', v)} />
      </Card>

      {/* Staff */}
      <Card titleEn="Staff" titleAr="الإطار الديني">
          <Input labelEn="Imam (5 Prayers)" labelAr="إمام الخمس" value={form.imam_5_prayers_name} onChangeText={t=>update('imam_5_prayers_name', t)} />
          <Input labelEn="Imam Jumuah" labelAr="إمام الجمعة" value={form.imam_jumua_name} onChangeText={t=>update('imam_jumua_name', t)} />
          <Input labelEn="Muazzin" labelAr="مؤذن" value={form.muazzin_name} onChangeText={t=>update('muazzin_name', t)} />
      </Card>
      
      {/* Prayer Times - Wait times */}
      <Card titleEn="" titleAr="وقت الانتظار بعد الآذان (بالدقائق)">
          <View style={styles.row}>
              <View style={styles.col}>
                  <InputLabel labelAr="الظهر" labelEn="Dhuhr" />
                  <TextInput style={styles.inputSmall} keyboardType="numeric" value={form.iqama_dhuhr} onChangeText={t=>update('iqama_dhuhr', t)} placeholder="10" />
              </View>
              <View style={styles.col}>
                  <InputLabel labelAr="الفجر" labelEn="Fajr" />
                  <TextInput style={styles.inputSmall} keyboardType="numeric" value={form.iqama_fajr} onChangeText={t=>update('iqama_fajr', t)} placeholder="10" />
              </View>
          </View>
          
          <View style={styles.row}>
               <View style={styles.col}>
                  <InputLabel labelAr="المغرب" labelEn="Maghrib" />
                  <TextInput style={styles.inputSmall} keyboardType="numeric" value={form.iqama_maghrib} onChangeText={t=>update('iqama_maghrib', t)} placeholder="5" />
              </View>
              <View style={styles.col}>
                  <InputLabel labelAr="العصر" labelEn="Asr" />
                  <TextInput style={styles.inputSmall} keyboardType="numeric" value={form.iqama_asr} onChangeText={t=>update('iqama_asr', t)} placeholder="10" />
              </View>
          </View>

          <View style={styles.row}>
               <View style={styles.col}>
                  <InputLabel labelAr="صلاة الجمعة" labelEn="Jumuah" />
                   {form.type === 'جامع' ? (
                       <TextInput 
                           style={styles.inputSmall} 
                           value={form.jumuah_time} 
                           onChangeText={t=>update('jumuah_time', t)} 
                           placeholder="13:00" 
                       />
                   ) : (
                       <View style={[styles.inputSmall, {backgroundColor: '#f0f0f0', justifyContent: 'center'}]}>
                           <Text style={{color: '#aaa', fontSize: 10, textAlign: 'center'}}>N/A</Text>
                       </View>
                   )}
              </View>
              <View style={styles.col}>
                  <InputLabel labelAr="العشاء" labelEn="Isha" />
                  <TextInput style={styles.inputSmall} keyboardType="numeric" value={form.iqama_isha} onChangeText={t=>update('iqama_isha', t)} placeholder="10" />
              </View> 
          </View>
      </Card>

      <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn} disabled={submitting}>
           {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Changes / حفظ التعديلات</Text>}
      </TouchableOpacity>
      
      {/* Modals for Pickers */}
      <SimplePicker visible={govPickerOpen} data={governorates} onClose={()=>setGovPickerOpen(false)} onSelect={(v)=>{update('governorate', v); setGovPickerOpen(false)}} />
      <SimplePicker visible={delPickerOpen} data={delegations} onClose={()=>setDelPickerOpen(false)} onSelect={(v)=>{update('delegation', v); setDelPickerOpen(false)}} />
      <SimplePicker visible={cityPickerOpen} data={cities} onClose={()=>setCityPickerOpen(false)} onSelect={(v)=>{update('city', v); setCityPickerOpen(false)}} />
      <SimplePicker visible={typePickerOpen} data={['جامع', 'مسجد', 'مصلى']} onClose={()=>setTypePickerOpen(false)} onSelect={(v)=>{update('type', v); setTypePickerOpen(false)}} />

      <View style={{height: 40}} />
    </ScrollView>
  );
}

// Subcomponents
const Card = ({ titleEn, titleAr, children }) => (
    <View style={styles.card}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8}}>
             <Text style={[styles.cardTitle, {textAlign: 'left', fontSize: 16}]}>{titleEn}</Text>
             <Text style={[styles.cardTitle, {textAlign: 'right', fontSize: 16}]}>{titleAr}</Text>
        </View>
        {children}
    </View>
);

const Input = ({ labelEn, labelAr, value, onChangeText, ...props }) => (
    <View style={{marginBottom: 12}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
             <Text style={styles.labelAr}>{labelAr}</Text>
             <Text style={styles.labelEn}>{labelEn}</Text>
        </View>
        <TextInput style={styles.input} value={value} onChangeText={onChangeText} {...props} />
    </View>
);

const InputLabel = ({ labelAr, labelEn }) => (
    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
        <Text style={[styles.labelAr, {fontSize: 12}]}>{labelAr}</Text>
        <Text style={[styles.labelEn, {fontSize: 12}]}>{labelEn}</Text>
    </View>
);

const PickerField = ({ labelEn, labelAr, value, onPress }) => (
    <View style={{marginBottom: 12}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
             <Text style={styles.labelAr}>{labelAr}</Text>
             <Text style={styles.labelEn}>{labelEn}</Text>
        </View>
        <TouchableOpacity style={styles.pickerBtn} onPress={onPress}>
               <Text style={{ textAlign: value ? 'left' : 'center', color: value ? '#000' : '#888' }}>
                   {value || `اختر ${labelAr} / Select...`}
               </Text>
        </TouchableOpacity>
    </View>
);

const Toggle = ({ labelEn, labelAr, value, onValueChange }) => (
    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 8}}>
        <Text style={{fontSize: 14, color: '#333', maxWidth: '40%', textAlign: 'left', fontFamily: 'Cairo-Regular'}}>{labelAr}</Text>
        <Switch value={value} onValueChange={onValueChange} />
        <Text style={{fontSize: 14, color: '#333', maxWidth: '40%', textAlign: 'right'}}>{labelEn}</Text>
    </View>
);

const SimplePicker = ({ visible, data, onClose, onSelect }) => (
    <Modal visible={visible} animationType="slide">
        <View style={{flex: 1, padding: 20, marginTop: 40, backgroundColor: '#fff'}}>
            <TouchableOpacity onPress={onClose} style={{alignSelf: 'flex-end', padding: 10}}><Text style={{fontWeight: 'bold', fontSize: 18}}>Close</Text></TouchableOpacity>
            <FlatList data={data} keyExtractor={i=>i} renderItem={({item}) => (
                <TouchableOpacity onPress={()=>onSelect(item)} style={{padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee'}}>
                    <Text style={{textAlign: 'center', fontSize: 16}}>{item}</Text>
                </TouchableOpacity>
            )} />
        </View>
    </Modal>
);

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: '#fcfcfc', paddingBottom: 50 },
    header: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 20, textAlign: 'center', fontFamily: 'Cairo-Bold' },
    card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8, fontFamily: 'Cairo-Bold' },
    labelEn: { fontSize: 12, color: '#666', fontWeight: '500' },
    labelAr: { fontSize: 12, color: '#666', fontFamily: 'Cairo-Regular' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 10, fontSize: 16, backgroundColor: '#fafafa', textAlign: 'right' },
    inputSmall: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 8, fontSize: 14, backgroundColor: '#fafafa', textAlign: 'center', height: 40 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    col: { width: '48%' },
    pickerBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 12, marginBottom: 4, backgroundColor: '#fafafa' },
    btn: { backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignSelf: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
    btnSmall: { backgroundColor: theme.colors.secondary, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 },
    btnSmallText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    submitBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: 'Cairo-Bold' }
});
