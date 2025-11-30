/**
 * Stash GraphQL Client
 * 
 * Handles communication with Stash GraphQL API for scene/image operations,
 * tag management, and marker creation.
 */

class StashClient {
  constructor(endpoint, apiKey = null) {
    this.endpoint = endpoint.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    if (this.apiKey) {
      this.headers['ApiKey'] = this.apiKey;
    }
  }

  /**
   * Make a GraphQL request to Stash
   */
  async graphql(query, variables = {}) {
    const payload = {
      query: query,
      variables: variables
    };

    try {
      const response = await fetch(`${this.endpoint}/graphql`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
      }

      return result.data;
    } catch (error) {
      console.error('GraphQL request failed:', error);
      throw error;
    }
  }

  /**
   * Health check for Stash connection
   */
  async healthCheck() {
    try {
      const query = `
        query {
          systemStatus {
            databasePath
            mode
          }
        }
      `;

      const result = await this.graphql(query);
      return {
        connected: true,
        status: result.systemStatus
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Get a scene by ID
   */
  async getScene(sceneId) {
    const query = `
      query FindScene($id: ID!) {
        findScene(id: $id) {
          id
          title
          details
          url
          date
          rating
          studio { id }
          gallery { id }
          files { id, path, size, duration, width, height, framerate, bitrate }
          tags { id, name }
          performers { id, name }
          scene_markers { id, title, seconds }
          stash_ids { stash_id, endpoint }
          created_at
          updated_at
        }
      }
    `;

    const result = await this.graphql(query, { id: sceneId });
    return result.findScene;
  }

  /**
   * Get an image by ID
   */
  async getImage(imageId) {
    const query = `
      query FindImage($id: ID!) {
        findImage(id: $id) {
          id
          title
          details
          rating
          gallery { id }
          files { id, path, size, width, height }
          tags { id, name }
          performers { id, name }
          stash_ids { stash_id, endpoint }
          created_at
          updated_at
        }
      }
    `;

    const result = await this.graphql(query, { id: imageId });
    return result.findImage;
  }

  /**
   * Get all scenes with pagination
   */
  async getAllScenes(limit = 100, page = 1) {
    const query = `
      query QueryScenes($filter: QuerySpec) {
        queryScenes(filter: $filter) {
          count
          scenes {
            id
            title
            details
            url
            date
            rating
            studio { id }
            gallery { id }
            files { id, path, size, duration, width, height, framerate, bitrate }
            tags { id, name }
            performers { id, name }
            scene_markers { id, title, seconds }
            stash_ids { stash_id, endpoint }
            created_at
            updated_at
          }
        }
      }
    `;

    const variables = {
      filter: {
        per_page: limit,
        page: page,
        q: ""
      }
    };

    const result = await this.graphql(query, variables);
    return {
      count: result.queryScenes.count,
      scenes: result.queryScenes.scenes
    };
  }

  /**
   * Get all images with pagination
   */
  async getAllImages(limit = 100, page = 1) {
    const query = `
      query QueryImages($filter: QuerySpec) {
        queryImages(filter: $filter) {
          count
          images {
            id
            title
            details
            rating
            gallery { id }
            files { id, path, size, width, height }
            tags { id, name }
            performers { id, name }
            stash_ids { stash_id, endpoint }
            created_at
            updated_at
          }
        }
      }
    `;

    const variables = {
      filter: {
        per_page: limit,
        page: page,
        q: ""
      }
    };

    const result = await this.graphql(query, variables);
    return {
      count: result.queryImages.count,
      images: result.queryImages.images
    };
  }

  /**
   * Get untagged scenes (scenes without AI-generated tags)
   */
  async getUntaggedScenes(limit = 100, page = 1) {
    const allScenes = await this.getAllScenes(limit, page);
    
    const untaggedScenes = allScenes.scenes.filter(scene => {
      return !scene.tags.some(tag => 
        tag.name.toLowerCase().startsWith("ai_") || 
        tag.name.toLowerCase().startsWith("generated_") ||
        tag.name.toLowerCase().startsWith("nsfw_")
      );
    });

    return {
      count: untaggedScenes.length,
      scenes: untaggedScenes
    };
  }

  /**
   * Get untagged images (images without AI-generated tags)
   */
  async getUntaggedImages(limit = 100, page = 1) {
    const allImages = await this.getAllImages(limit, page);
    
    const untaggedImages = allImages.images.filter(image => {
      return !image.tags.some(tag => 
        tag.name.toLowerCase().startsWith("ai_") || 
        tag.name.toLowerCase().startsWith("generated_") ||
        tag.name.toLowerCase().startsWith("nsfw_")
      );
    });

    return {
      count: untaggedImages.length,
      images: untaggedImages
    };
  }

  /**
   * Get recent scenes (from last N days)
   */
  async getRecentScenes(days = 7, limit = 100, page = 1) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);
    const thresholdStr = thresholdDate.toISOString();

    const query = `
      query QueryScenes($filter: QuerySpec) {
        queryScenes(filter: $filter) {
          count
          scenes {
            id
            title
            details
            url
            date
            rating
            studio { id }
            gallery { id }
            files { id, path, size, duration, width, height, framerate, bitrate }
            tags { id, name }
            performers { id, name }
            scene_markers { id, title, seconds }
            stash_ids { stash_id, endpoint }
            created_at
            updated_at
          }
        }
      }
    `;

    const variables = {
      filter: {
        per_page: limit,
        page: page,
        direction: "DESC",
        sort: "created_at",
        q: `created_at:>${thresholdStr}`
      }
    };

    const result = await this.graphql(query, variables);
    return {
      count: result.queryScenes.count,
      scenes: result.queryScenes.scenes
    };
  }

  /**
   * Get recent images (from last N days)
   */
  async getRecentImages(days = 7, limit = 100, page = 1) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);
    const thresholdStr = thresholdDate.toISOString();

    const query = `
      query QueryImages($filter: QuerySpec) {
        queryImages(filter: $filter) {
          count
          images {
            id
            title
            details
            rating
            gallery { id }
            files { id, path, size, width, height }
            tags { id, name }
            performers { id, name }
            stash_ids { stash_id, endpoint }
            created_at
            updated_at
          }
        }
      }
    `;

    const variables = {
      filter: {
        per_page: limit,
        page: page,
        direction: "DESC",
        sort: "created_at",
        q: `created_at:>${thresholdStr}`
      }
    };

    const result = await this.graphql(query, variables);
    return {
      count: result.queryImages.count,
      images: result.queryImages.images
    };
  }

  /**
   * Get file path for a scene
   */
  async getSceneFilePath(sceneId) {
    const scene = await this.getScene(sceneId);
    if (scene && scene.files && scene.files.length > 0) {
      return scene.files[0].path;
    }
    return null;
  }

  /**
   * Get file path for an image
   */
  async getImageFilePath(imageId) {
    const image = await this.getImage(imageId);
    if (image && image.files && image.files.length > 0) {
      return image.files[0].path;
    }
    return null;
  }

  /**
   * Create a tag if it doesn't exist
   */
  async createTagIfNotExists(tagName) {
    try {
      // First check if tag exists
      const existingTag = await this.getTagByName(tagName);
      if (existingTag) {
        return existingTag.id;
      }

      // Create new tag
      const mutation = `
        mutation CreateTag($input: TagCreateInput!) {
          createTag(input: $input) {
            id
            name
          }
        }
      `;

      const variables = {
        input: {
          name: tagName,
          ignore_auto_tag: true
        }
      };

      const result = await this.graphql(mutation, variables);
      return result.createTag.id;
    } catch (error) {
      console.error(`Failed to create tag ${tagName}:`, error);
      return null;
    }
  }

  /**
   * Get a tag by name
   */
  async getTagByName(tagName) {
    const query = `
      query FindTag($name: String!) {
        findTag(name: $name) {
          id
          name
          image
        }
      }
    `;

    try {
      const result = await this.graphql(query, { name: tagName });
      return result.findTag;
    } catch (error) {
      console.error(`Failed to get tag ${tagName}:`, error);
      return null;
    }
  }

  /**
   * Add tags to a scene
   */
  async addTagsToScene(sceneId, tagIds) {
    const mutation = `
      mutation BulkSceneUpdate($input: BulkSceneUpdateInput!) {
        bulkSceneUpdate(input: $input) {
          id
        }
      }
    `;

    const variables = {
      input: {
        ids: [sceneId],
        tag_ids: {
          ids: tagIds,
          mode: "ADD"
        }
      }
    };

    try {
      await this.graphql(mutation, variables);
      console.log(`Added ${tagIds.length} tags to scene ${sceneId}`);
    } catch (error) {
      console.error(`Failed to add tags to scene ${sceneId}:`, error);
      throw error;
    }
  }

  /**
   * Add tags to an image
   */
  async addTagsToImage(imageId, tagIds) {
    const mutation = `
      mutation BulkImageUpdate($input: BulkImageUpdateInput!) {
        bulkImageUpdate(input: $input) {
          id
        }
      }
    `;

    const variables = {
      input: {
        ids: [imageId],
        tag_ids: {
          ids: tagIds,
          mode: "ADD"
        }
      }
    };

    try {
      await this.graphql(mutation, variables);
      console.log(`Added ${tagIds.length} tags to image ${imageId}`);
    } catch (error) {
      console.error(`Failed to add tags to image ${imageId}:`, error);
      throw error;
    }
  }

  /**
   * Create a scene marker
   */
  async createSceneMarker(sceneId, title, seconds, tagNames = []) {
    const mutation = `
      mutation CreateSceneMarker($input: SceneMarkerCreateInput!) {
        createSceneMarker(input: $input) {
          id
          title
          seconds
          primary_tag { id, name }
          tags { id, name }
        }
      }
    `;

    // Get tag IDs if tag names provided
    const tagIds = [];
    if (tagNames && tagNames.length > 0) {
      for (const tagName of tagNames) {
        const tag = await this.getTagByName(tagName);
        if (tag) {
          tagIds.push(tag.id);
        }
      }
    }

    const variables = {
      input: {
        scene_id: sceneId,
        title: title,
        seconds: seconds,
        tag_ids: tagIds
      }
    };

    try {
      const result = await this.graphql(mutation, variables);
      console.log(`Created marker for scene ${sceneId}: ${title}`);
      return result.createSceneMarker;
    } catch (error) {
      console.error(`Failed to create scene marker:`, error);
      throw error;
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus() {
    const query = `
      query {
        systemStatus {
          databasePath
          mode
        }
      }
    `;

    try {
      const result = await this.graphql(query);
      return result.systemStatus;
    } catch (error) {
      console.error('Failed to get system status:', error);
      throw error;
    }
  }

  /**
   * Get plugin settings from Stash
   */
  async getPluginSettings(pluginName) {
    const query = `
      query {
        configuration {
          plugins {
            name
            settings
          }
        }
      }
    `;

    try {
      const result = await this.graphql(query);
      const plugin = result.configuration.plugins.find(p => p.name === pluginName);
      return plugin ? plugin.settings : null;
    } catch (error) {
      console.error('Failed to get plugin settings:', error);
      return null;
    }
  }

  /**
   * Update plugin settings in Stash
   */
  async updatePluginSettings(pluginName, settings) {
    const mutation = `
      mutation UpdatePluginSettings($input: PluginSettingsInput!) {
        updatePluginSettings(input: $input) {
          name
          settings
        }
      }
    `;

    const variables = {
      input: {
        name: pluginName,
        settings: settings
      }
    };

    try {
      const result = await this.graphql(mutation, variables);
      return result.updatePluginSettings;
    } catch (error) {
      console.error('Failed to update plugin settings:', error);
      throw error;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StashClient;
} else if (typeof window !== 'undefined') {
  window.StashClient = StashClient;
}
