import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Switch, TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator, Image } from 'react-native';
import { theme } from '../theme';
import { suggestMosque, uploadImage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMosques } from '../context/MosquesContext';
import { governorates as GOVS, fetchDelegations, fetchCities } from '../services/locations';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AddMosqueScreen({ navigation }) {
  const { jwt, role, signOut } = useAuth(); // signOut exposed
  const { mosques } = useMosques();
  
  // --- Fields ---
  const [form, setForm] = useState({
    arabic_name: '',
    type: 'جامع',
    governorate: '',
    delegation: '',
    city: '',
    neighborhood: '',
    address: '',
    latitude: '',
    longitude: '',
    
    // Detailed Facilities
    women_section: false,
    wudu: false,
    men_bathrooms: false,
    women_bathrooms: false,
    parking: false,
    accessibility: false,
    ac: false,
    library: false,
    quran_school: false,
    daily_prayers: false,
    jumua_prayer: false,
    morgue: false, // Mortuary/Ghusl
    
    // Staff
    muazzin_name: '',
    imam_5_prayers_name: '',
    imam_jumua_name: '',
    
    // Timings
    jumuah_time: '',
    eid_info: '',
    iqama_fajr: '',
    iqama_dhuhr: '',
    iqama_asr: '',
    iqama_maghrib: '',
    iqama_isha: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  
  // Locations
  const [govPickerOpen, setGovPickerOpen] = useState(false);
  const [delPickerOpen, setDelPickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [delegations, setDelegations] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingDel, setLoadingDel] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [searchDel, setSearchDel] = useState('');
  const [searchCity, setSearchCity] = useState('');
  
  const [region, setRegion] = useState({ latitude: 34.0, longitude: 9.6, latitudeDelta: 6.0, longitudeDelta: 6.0 });
  const [imageUri, setImageUri] = useState(null);

  // If role is guest, render simple blocking view to prevent interaction behind alert
  if (role === 'guest') {
      return (
          <View style={{flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 20}}>
              <Image source={require('../../assets/zitouna2.png')} style={{width: 100, height: 100, marginBottom: 20, resizeMode: 'contain'}} />
              <Text style={{fontSize: 20, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 10, textAlign: 'center'}}>Access Restricted / محتوى خاص</Text>
              <Text style={{fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#666', lineHeight: 24}}>
                  You must be logged in to add a mosque.{"\n"}
                  الرجاء تسجيل الدخول لإضافة مسجد
              </Text>
              
              <TouchableOpacity onPress={signOut} style={styles.btn}> 
                   <Text style={styles.btnText}>Login / تسجيل الدخول</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 20}}>
                   <Text style={{color: '#888'}}>Go Back / رجوع</Text>
              </TouchableOpacity>
          </View>
      );
  }

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const governorates = GOVS;

  // ... (Location Effects omitted for brevity, logic remains same) ...
  useEffect(() => {
    (async () => {
      setLoadingDel(true);
      try {
        if (form.governorate) {
          const list = await fetchDelegations(form.governorate);
          setDelegations(list);
        } else {
          setDelegations([]);
        }
      } finally {
        setLoadingDel(false);
      }
      update('delegation', '');
      update('city', '');
      setCities([]);
      setSearchDel('');
      setSearchCity('');
    })();
  }, [form.governorate]);

  useEffect(() => {
    (async () => {
      setLoadingCity(true);
      try {
        if (form.governorate && form.delegation) {
          const list = await fetchCities(form.governorate, form.delegation);
          setCities(list);
        } else {
          setCities([]);
        }
      } finally {
        setLoadingCity(false);
      }
      update('city', '');
      setSearchCity('');
    })();
  }, [form.governorate, form.delegation]);


  const handleSubmit = async () => {
      if(!form.arabic_name || !form.governorate) {
          alert("Name and Governorate are required / الاسم والولاية مطلوبان");
          return;
      }
      
      setSubmitting(true);
      try {
          let uploadedUrl = null;
          if (imageUri) {
              uploadedUrl = await uploadImage(imageUri);
          }
          
          const payload = {
              ...form,
              image_url: uploadedUrl,
              facilities: {
                  women_section: form.women_section,
                  wudu: form.wudu,
                  men_bathrooms: form.men_bathrooms,
                  women_bathrooms: form.women_bathrooms,
                  parking: form.parking,
                  accessibility: form.accessibility,
                  ac: form.ac,
                  library: form.library,
                  quran_school: form.quran_school,
                  daily_prayers: form.daily_prayers,
                  jumua_prayer: form.jumua_prayer,
                  morgue: form.morgue
              },
              iqama_times: {
                  fajr: form.iqama_fajr,
                  dhuhr: form.iqama_dhuhr,
                  asr: form.iqama_asr,
                  maghrib: form.iqama_maghrib,
                  isha: form.iqama_isha
              }
          };
          
          await suggestMosque(payload);
          Alert.alert("Success", "Mosque suggestion submitted for review!");
          navigation.goBack();
      } catch (e) {
          Alert.alert("Error", "Failed to submit: " + (e.response?.data?.message || e.message));
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
  
  const locateMe = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
      });
      update('latitude', location.coords.latitude);
      update('longitude', location.coords.longitude);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Suggest a New Mosque / إضافة مسجد</Text>

      {/* Basic Info */}
      <Card title="Basic Information / معلومات أساسية">
          <Input 
              labelAr="اسم الجامع" 
              labelEn="Mosque Name (Arabic)" 
              value={form.arabic_name} 
              onChangeText={t=>update('arabic_name', t)} 
          />
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
               <View style={{flexDirection: 'row', alignItems: 'center'}}>
                 <Text style={styles.labelAr}>النوع</Text>
                 <TouchableOpacity onPress={() => setInfoModalVisible(true)} style={{marginLeft: 6}}>
                     <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.primary} />
                 </TouchableOpacity>
               </View>
               <Text style={styles.labelEn}>Mosque Type</Text>
          </View>
          <TouchableOpacity style={styles.pickerBtn} onPress={()=>setTypePickerOpen(true)}>
               <Text style={{ textAlign: form.type ? 'left' : 'center', color: form.type ? '#000' : '#888' }}>
                   {form.type || 'اختر... / Select...'}
               </Text>
          </TouchableOpacity>
      </Card>

      {/* Location */}
      <Card title="Location / الموقع">
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
           
           <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBotton: 10}}>
                <TouchableOpacity onPress={locateMe} style={[styles.btnSmall]}>
                    <Text style={styles.btnSmallText}>Use My Location</Text>
                </TouchableOpacity>
                <Text style={{fontSize: 12, color: '#666'}}>استخدم موقعي الحالي</Text>
           </View>
           
           <View style={{height: 200, borderRadius: 8, overflow: 'hidden', marginTop: 10, marginBottom: 5}}>
                <MapView style={{flex: 1}} region={region} onPress={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    update('latitude', latitude);
                    update('longitude', longitude); 
                }}>
                    {(form.latitude && form.longitude) ? <Marker coordinate={{latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude)}} /> : null}
                </MapView>
           </View>
           <Text style={{fontSize: 10, color: '#888', textAlign: 'center'}}>Tap map to set pin / اضغط على الخريطة لتحديد الموقع</Text>
      </Card>
      
      {/* Facilities */}
      <Card title="Facilities / المرافق">
          <Toggle labelEn="Women's Section" labelAr="مصلى نساء" value={form.women_section} onValueChange={v=>update('women_section', v)} />
          <Toggle labelEn="Wudu Area" labelAr="ميضأة" value={form.wudu} onValueChange={v=>update('wudu', v)} />
          <Toggle labelEn="Accessible" labelAr="تسهيلات ذوي الاحتياجات" value={form.accessibility} onValueChange={v=>update('accessibility', v)} />
          <Toggle labelEn="Parking" labelAr="موقف سيارات" value={form.parking} onValueChange={v=>update('parking', v)} />
          <Toggle labelEn="Air Conditioning" labelAr="مكيف" value={form.ac} onValueChange={v=>update('ac', v)} />
          <Toggle labelEn="Library" labelAr="مكتبة" value={form.library} onValueChange={v=>update('library', v)} />
          <Toggle labelEn="Quran School" labelAr="كتاب" value={form.quran_school} onValueChange={v=>update('quran_school', v)} />
          <Toggle labelEn="Mortuary" labelAr="بيت تغسيل موتى" value={form.morgue} onValueChange={v=>update('morgue', v)} />
          <Toggle labelEn="Daily Prayers" labelAr="صلوات خمس" value={form.daily_prayers} onValueChange={v=>update('daily_prayers', v)} />
          <Toggle labelEn="Jumuah Prayer" labelAr="صلاة جمعة" value={form.jumua_prayer} onValueChange={v=>update('jumua_prayer', v)} />
      </Card>
      
      {/* Staff */}
      <Card title="Staff / الإطار الديني">
          <Input labelEn="Imam (5 Prayers)" labelAr="إمام الخمس" value={form.imam_5_prayers_name} onChangeText={t=>update('imam_5_prayers_name', t)} />
          <Input labelEn="Imam Jumuah" labelAr="إمام الجمعة" value={form.imam_jumua_name} onChangeText={t=>update('imam_jumua_name', t)} />
          <Input labelEn="Muazzin" labelAr="مؤذن" value={form.muazzin_name} onChangeText={t=>update('muazzin_name', t)} />
      </Card>
      
      {/* Image */}
      <Card title="Photo / صورة">
           <TouchableOpacity onPress={pickImage} style={{height: 150, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderRadius: 8}}>
               {imageUri ? <Image source={{uri: imageUri}} style={{width: '100%', height: '100%', borderRadius: 8}} resizeMode="cover"/> : <Text>Tap to pick image / اضغط لاختيار صورة</Text>}
           </TouchableOpacity>
      </Card>

      <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn} disabled={submitting}>
           {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Suggestion / إرسال</Text>}
      </TouchableOpacity>
      
      {/* Modals for Pickers */}
      <SimplePicker visible={govPickerOpen} data={governorates} onClose={()=>setGovPickerOpen(false)} onSelect={(v)=>{update('governorate', v); setGovPickerOpen(false)}} />
      <SimplePicker visible={delPickerOpen} data={delegations} onClose={()=>setDelPickerOpen(false)} onSelect={(v)=>{update('delegation', v); setDelPickerOpen(false)}} />
      <SimplePicker visible={cityPickerOpen} data={cities} onClose={()=>setCityPickerOpen(false)} onSelect={(v)=>{update('city', v); setCityPickerOpen(false)}} />
      <SimplePicker visible={typePickerOpen} data={['جامع', 'مسجد', 'مصلى']} onClose={()=>setTypePickerOpen(false)} onSelect={(v)=>{update('type', v); setTypePickerOpen(false)}} />
      
      {/* Info Modal */}
      <Modal visible={infoModalVisible} transparent={true} animationType="fade" onRequestClose={()=>setInfoModalVisible(false)}>
          <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20}}>
              <View style={{backgroundColor: '#fff', borderRadius: 10, padding: 20, width: '90%'}}>
                  <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center'}}>Mosque Types / أنواع المساجد</Text>
                  
                  <View style={{marginBottom: 10}}>
                      <Text style={{fontWeight: 'bold'}}>Jami (جامع):</Text>
                      <Text style={{color: '#555'}}>Large mosque that hosts Friday (Jumuah) prayers.</Text>
                      <Text style={{color: '#555', textAlign: 'right'}}>جامع كبير تقام فيه صلاة الجمعة.</Text>
                  </View>
                  <View style={{marginBottom: 10}}>
                      <Text style={{fontWeight: 'bold'}}>Masjid (مسجد):</Text>
                      <Text style={{color: '#555'}}>Mosque for 5 daily prayers, usually no Jumuah.</Text>
                      <Text style={{color: '#555', textAlign: 'right'}}>مسجد للصلوات الخمس عادة لا تقام فيه الجمعة.</Text>
                  </View>
                  <View style={{marginBottom: 10}}>
                      <Text style={{fontWeight: 'bold'}}>Musalla (مصلى):</Text>
                      <Text style={{color: '#555'}}>Prayer room or small space, often in buildings.</Text>
                      <Text style={{color: '#555', textAlign: 'right'}}>غرفة صلاة أو مصلى صغير.</Text>
                  </View>

                  <TouchableOpacity onPress={()=>setInfoModalVisible(false)} style={[styles.btn, {marginTop: 10}]}>
                      <Text style={styles.btnText}>Close / إغلاق</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      <View style={{height: 40}} />
    </ScrollView>
  );
}

// Subcomponents
const Card = ({ title, children }) => (
    <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
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
    container: { padding: 16, backgroundColor: '#fcfcfc' },
    header: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 20, textAlign: 'center', fontFamily: 'Cairo-Bold' },
    card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8, fontFamily: 'Cairo-Bold' },
    labelEn: { fontSize: 12, color: '#666', fontWeight: '500' },
    labelAr: { fontSize: 12, color: '#666', fontFamily: 'Cairo-Regular' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 10, fontSize: 16, backgroundColor: '#fafafa', textAlign: 'right' },
    pickerBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 12, marginBottom: 4, backgroundColor: '#fafafa' },
    btn: { backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignSelf: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
    btnSmall: { backgroundColor: theme.colors.secondary, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 },
    btnSmallText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    submitBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: 'Cairo-Bold' }
});
