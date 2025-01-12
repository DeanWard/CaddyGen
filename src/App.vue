<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus, Pencil, Trash2, Server, HardDrive, Lock, Zap, Globe, Github, ExternalLink, Settings, ChevronDown, ChevronUp, Upload } from 'lucide-vue-next';
import type { CaddyHost } from './types/caddy';
import { presets } from './presets';
import HostForm from './components/HostForm.vue';
import CaddyConfig from './components/CaddyConfig.vue';
import ImportModal from './components/ImportModal.vue';

const showDescription = ref(localStorage.getItem('showDescription') !== 'false');
const hosts = ref<CaddyHost[]>([]);
const showForm = ref(false);
const editingHost = ref<CaddyHost | undefined>();
const showImportModal = ref(false);

function toggleDescription() {
  showDescription.value = !showDescription.value;
  localStorage.setItem('showDescription', showDescription.value.toString());
}

onMounted(() => {

  //console log the env
  console.log(import.meta.env)
  

  if(import.meta.env.VITE_PERSIST_DATA_ON_SERVER === 'true') {
    fetch(`${import.meta.env.VITE_API_URL}/read-data`)
      .then(response => response.json())
      .then(data => {
        hosts.value = data;
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }

  if(import.meta.env.VITE_PERSIST_DATA_ON_SERVER === 'false') {
    const savedHosts = localStorage.getItem('caddyHosts');
    if (savedHosts) {
      hosts.value = JSON.parse(savedHosts);
    }
  }

});

function saveHost(host: CaddyHost) {
  const index = hosts.value.findIndex(h => h.id === host.id);
  if (index >= 0) {
    hosts.value[index] = host;
  } else {
    hosts.value.push(host);
  }

  if(import.meta.env.VITE_PERSIST_DATA_ON_SERVER === 'true') {
    fetch(`${import.meta.env.VITE_API_URL}/save-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(hosts.value),
    });
  }

  if(import.meta.env.VITE_PERSIST_DATA_ON_SERVER === 'false') {
    localStorage.setItem('caddyHosts', JSON.stringify(hosts.value));
  }

  showForm.value = false;
  editingHost.value = undefined;
}

function editHost(host: CaddyHost) {
  editingHost.value = { ...host };
  showForm.value = true;
}

function deleteHost(id: string) {
  hosts.value = hosts.value.filter(h => h.id !== id);
  localStorage.setItem('caddyHosts', JSON.stringify(hosts.value));
}

function cancelEdit() {
  showForm.value = false;
  editingHost.value = undefined;
}

function importHosts(newHosts: CaddyHost[]) {
  // Only add hosts that don't already exist (based on domain)
  const existingDomains = new Set(hosts.value.map(h => h.domain));
  const hostsToAdd = newHosts.filter(h => !existingDomains.has(h.domain));
  
  hosts.value.push(...hostsToAdd);
  localStorage.setItem('caddyHosts', JSON.stringify(hosts.value));
}
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background-color: #101227">
    <div class="container py-8 flex-1">
      <h1 class="flex items-center gap-3 text-4xl font-bold mb-8 text-white">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Settings class="w-7 h-7 text-white" />
        </div>
        <div class="flex flex-col">
          <span>CaddyGen</span>
          <span class="text-lg font-normal text-white/80">Caddy Config Generator</span>
        </div>
      </h1>
      
      <div class="mb-8">
        <div class=" mb-2">
          <button 
            @click="showImportModal = true"
            class="absolute top-0 right-0 inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg px-4 py-2 transition-colors" style="position:absolute;top:10px;right:10px;"
          >
            <Upload class="w-4 h-4" />
            Import Caddyfile
          </button>
          <button 
            class="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            @click="toggleDescription"
          >
            <component :is="showDescription ? ChevronUp : ChevronDown" class="w-4 h-4" />
            <span>About CaddyGen</span>
          </button>
        </div>
        <div 
          v-if="showDescription"
          class="text-muted-foreground space-y-2 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <p>
            A user-friendly interface for generating Caddy server configurations. Create and manage reverse proxy and file server 
            configurations with support for SSL, compression, security headers, and more.
          </p>
          <p>
            Choose from popular application presets or create custom configurations. All changes are saved locally in your browser.
          </p>
        </div>
      </div>
    
      <div class="hosts-list" v-if="!showForm">
        <div class="flex gap-2">
          <button 
            @click="showForm = true" 
            class="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg px-4 py-2 transition-colors"
          >
            <Plus class="w-4 h-4" />
            Add New Host
          </button>
        </div>
      
        <div v-if="hosts.length === 0" class="mt-8 text-center p-8 rounded-lg bg-card/50 border border-border/50">
          <p class="text-muted-foreground">No hosts configured yet. Add your first host to get started!</p>
        </div>
      
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <div 
            v-for="host in hosts" 
            :key="host.id" 
            class="p-6 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
            style="background: linear-gradient(to bottom right, #6b3ce4, #9165f2); position: relative; overflow: hidden;"
          >
            <template v-if="host.presetName" v-for="preset in presets" :key="preset.name">
              <template v-if="preset.name === host.presetName && preset.logo">
                <div 
                  class="absolute right-0 bottom-0 w-40 h-40 opacity-30 transform translate-x-10 translate-y-10 [&_*]:fill-white"
                  v-html="preset.logo"
                  style="max-width: 160px; max-height: 160px;"
                ></div>
              </template>
            </template>
            <div class="flex items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-2">
                <component :is="host.fileServer ? HardDrive : Server" class="w-5 h-5 text-white/80" />
                <a
                  v-if="!host.domain.startsWith(':')"
                  :href="`https://${host.domain}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-lg font-semibold text-white hover:text-white/90 transition-colors"
                >
                  <span class="text-white/50 mr-0.5">https://</span>{{ host.domain }}
                </a>
                <span
                  v-else
                  class="text-lg font-semibold text-white"
                >
                  {{ host.domain }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs px-2 py-0.5 rounded-full bg-white text-primary">
                {{ host.presetName || 'Custom' }}
              </span>
              <template v-if="host.presetName" v-for="preset in presets" :key="preset.name">
                <template v-if="preset.name === host.presetName">
                  <div class="flex gap-1">
                    <a 
                      v-if="preset.webLink"
                      :href="preset.webLink"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-white/80 hover:text-white transition-colors"
                      :title="`Visit ${preset.name} website`"
                    >
                      <ExternalLink class="w-3 h-3" />
                    </a>
                    <a 
                      v-if="preset.githubLink"
                      :href="preset.githubLink"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-white/80 hover:text-white transition-colors"
                      :title="`View ${preset.name} on GitHub`"
                    >
                      <Github class="w-3 h-3" />
                    </a>
                  </div>
                </template>
              </template>
            </div>
            <p class="text-white/80 mb-4">
              <div class="flex items-center gap-2">
                <span>{{ host.fileServer ? 'File Server' : 'Reverse Proxy' }}</span>
                <div class="flex gap-1">
                  <Lock v-if="host.tls?.email || host.tls?.selfSigned" class="w-4 h-4" title="TLS Enabled" />
                  <Zap v-if="host.encode" class="w-4 h-4" title="Compression Enabled" />
                </div>
              </div>
              <span v-if="host.fileServer" class="block mt-1 text-sm">
                {{ host.fileServer.root }}
                <span v-if="host.fileServer.browse || host.fileServer.php || host.fileServer.frankenphp" class="text-white/60">
                  ({{ [
                    host.fileServer.browse ? 'Browse' : null,
                    host.fileServer.php ? 'PHP' : null,
                    host.fileServer.frankenphp ? 'FrankenPHP' : null,
                  ].filter(Boolean).join(', ') }})
                </span>
              </span>
              <span v-else class="block mt-1 text-sm text-white/60">{{ host.reverseProxy }}</span>
            </p>
            <div class="flex gap-2">
              <button 
                @click="editHost(host)" 
                class="bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded p-1.5 transition-colors"
                title="Edit host"
              >
                <Pencil class="w-4 h-4" />
              </button>
              <button 
                @click="deleteHost(host.id)" 
                class="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded p-1.5 transition-colors"
                title="Delete host"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <CaddyConfig :hosts="hosts" v-if="hosts.length > 0" />
      </div>

      <HostForm
        v-else
        :initial-host="editingHost"
        @save="saveHost"
        @cancel="cancelEdit"
      />
      
      <ImportModal
        :show="showImportModal"
        @close="showImportModal = false"
        @import="importHosts"
      />
    </div>
    
    <footer class="py-8 border-t border-border/50">
      <div class="container">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div class="flex items-center gap-2">
            <a 
              href="https://caddyserver.com" 
              target="_blank" 
              rel="noopener noreferrer"
              class="hover:text-foreground transition-colors"
            >
              Caddy Server
            </a>
            <span>•</span>
            <a 
              href="https://caddyserver.com/docs/" 
              target="_blank" 
              rel="noopener noreferrer"
              class="hover:text-foreground transition-colors"
            >
              Caddy Documentation
            </a>
            <span>•</span>
            <a 
              href="https://github.com/DeanWard/CaddyGen" 
              target="_blank" 
              rel="noopener noreferrer"
              class="hover:text-foreground transition-colors"
            >
              <div class="flex items-center gap-1">
                <Github class="w-4 h-4" />
                <span>GitHub</span>
              </div>
            </a>
          </div>
          <div class="text-center md:text-right">
            <p>Made with ❤️ for the Caddy community</p>
            <p class="text-xs mt-1">Configurations are stored locally in your browser</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>