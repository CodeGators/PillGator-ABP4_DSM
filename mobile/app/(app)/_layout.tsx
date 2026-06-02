import type { ComponentProps } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EstadoCarregando } from '@/src/componentes/base/EstadoCarregando';
import { Tela } from '@/src/componentes/base/Tela';
import { CabecalhoPacienteSelecionado } from '@/src/componentes/dominio/CabecalhoPacienteSelecionado';
import { tema } from '@/src/config/tema';
import { useAutenticacao } from '@/src/hooks/useAutenticacao';
import { useRegistrarPushToken } from '@/src/hooks/useRegistrarPushToken';

type IconeNome = ComponentProps<typeof FontAwesome>['name'];

function TabIcon({
  name,
  color,
  focused,
}: {
  name: IconeNome;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconeAba, focused && styles.iconeAbaAtivo]}>
      <FontAwesome color={color} name={name} size={22} />
    </View>
  );
}

export default function AppLayout() {
  const { carregandoSessao, token } = useAutenticacao();
  useRegistrarPushToken();

  if (carregandoSessao) {
    return (
      <Tela semScroll>
        <EstadoCarregando mensagem="Carregando sessao..." />
      </Tela>
    );
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        header: () => <CabecalhoPacienteSelecionado />,
        headerShown: true,
        tabBarActiveTintColor: tema.cores.primaria,
        tabBarInactiveTintColor: tema.cores.textoFraco,
        tabBarShowLabel: false,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
        },
        tabBarStyle: {
          backgroundColor: tema.cores.superficie,
          borderColor: tema.cores.bordaForte,
          borderTopWidth: 1,
          height: 78,
          paddingBottom: 14,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          headerShown: false,
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="pacientes"
        options={{
          title: 'Pacientes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="users" />
          ),
        }}
      />
      <Tabs.Screen
        name="medicamentos"
        options={{
          title: 'Remedios',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="medkit" />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="calendar" />
          ),
        }}
      />
      <Tabs.Screen
        name="gavetas"
        options={{
          title: 'Gavetas',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="inbox" />
          ),
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Historico',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="history" />
          ),
        }}
      />
      <Tabs.Screen
        name="alertas"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="bell" />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="cog" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconeAba: {
    alignItems: 'center',
    borderRadius: tema.raios.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  iconeAbaAtivo: {
    backgroundColor: tema.cores.primariaSuave,
    borderColor: tema.cores.primaria,
    borderWidth: 1,
  },
});
